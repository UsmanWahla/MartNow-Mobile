import { apiConfig } from '@/constants/config';

import { clearAccessToken, getAccessToken, saveAccessToken } from './auth-token';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
}

interface ErrorPayload {
  message?: unknown;
}

interface RefreshPayload {
  token?: unknown;
}

let refreshPromise: Promise<string | null> | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as ErrorPayload).message === 'string'
  ) {
    return (payload as ErrorPayload).message as string;
  }

  return fallback;
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildUrl(path: string): string {
  if (!apiConfig.baseUrl) {
    throw new ApiError(
      'EXPO_PUBLIC_API_URL is not configured. Copy .env.example to .env and use your computer LAN IP.',
    );
  }

  return `${apiConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

    try {
      const response = await fetch(buildUrl('/api/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
        signal: controller.signal,
      });
      const payload = (await readResponse(response)) as RefreshPayload | null;
      if (!response.ok || typeof payload?.token !== 'string') return null;
      await saveAccessToken(payload.token);
      return payload.token;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeoutMs);

  try {
    const token = options.requiresAuth === false ? null : await getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      credentials: 'include',
    });
    const payload = await readResponse(response);

    if (
      response.status === 401 &&
      options.requiresAuth !== false &&
      !isRetry &&
      path !== '/api/logout'
    ) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) return request<T>(path, options, true);
      await clearAccessToken();
      await unauthorizedHandler?.();
    }

    if (!response.ok) {
      throw new ApiError(
        errorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${apiConfig.timeoutMs / 1000} seconds.`);
    }

    if (error instanceof Error) {
      throw new ApiError(error.message || 'Unable to reach the MartNow backend.');
    }

    throw new ApiError('Unable to reach the MartNow backend.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
