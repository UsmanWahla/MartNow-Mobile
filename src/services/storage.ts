import * as SecureStore from 'expo-secure-store';

export async function getStoredValue(key: string) {
  return SecureStore.getItemAsync(key);
}

export async function setStoredValue(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredValue(key: string) {
  await SecureStore.deleteItemAsync(key);
}
