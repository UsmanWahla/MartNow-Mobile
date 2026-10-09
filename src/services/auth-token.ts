import { deleteStoredValue, getStoredValue, setStoredValue } from './storage';

const ACCESS_TOKEN_KEY = 'martnow.customer.access-token';
const REFRESH_TOKEN_KEY = 'martnow.customer.refresh-token';

let cachedAccessToken: string | null | undefined;

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken !== undefined) {
    return cachedAccessToken;
  }

  cachedAccessToken = await getStoredValue(ACCESS_TOKEN_KEY);
  return cachedAccessToken;
}

export async function saveAccessToken(token: string): Promise<void> {
  if (typeof token !== 'string' || !token) {
    throw new Error('Login did not return an access token.');
  }
  cachedAccessToken = token;
  await setStoredValue(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return getStoredValue(REFRESH_TOKEN_KEY);
}

export async function saveRefreshToken(token: string): Promise<void> {
  if (typeof token !== 'string' || !token) return;
  await setStoredValue(REFRESH_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  cachedAccessToken = null;
  await Promise.all([deleteStoredValue(ACCESS_TOKEN_KEY), deleteStoredValue(REFRESH_TOKEN_KEY)]);
}
