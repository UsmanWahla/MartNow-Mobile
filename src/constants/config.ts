const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export const apiConfig = {
  baseUrl: rawApiUrl ? normalizeBaseUrl(rawApiUrl) : '',
  displayUrl: rawApiUrl ? normalizeBaseUrl(rawApiUrl) : 'Not configured',
  timeoutMs: 15_000,
} as const;
