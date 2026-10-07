import { deleteStoredValue, getStoredValue, setStoredValue } from './storage';

const ACCESS_TOKEN_KEY = 'martnow.customer.access-token';

let cachedAccessToken: string | null | undefined;

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken !== undefined) {
    return cachedAccessToken;
  }

  cachedAccessToken = await getStoredValue(ACCESS_TOKEN_KEY);
  return cachedAccessToken;
}

export async function saveAccessToken(token: string): Promise<void> {
  cachedAccessToken = token;
  await setStoredValue(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  cachedAccessToken = null;
  await deleteStoredValue(ACCESS_TOKEN_KEY);
}
