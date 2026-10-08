const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export const apiConfig = {
  baseUrl: rawApiUrl ? normalizeBaseUrl(rawApiUrl) : '',
  timeoutMs: 15_000,
} as const;
