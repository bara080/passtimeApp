import * as SecureStore from "expo-secure-store";

export async function saveToSecureStore(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getFromSecureStore(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function clearFromSecureStore(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearSecureStore(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k).catch(() => {})));
}

export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: "passtime_accessToken",
  REFRESH_TOKEN: "passtime_refreshToken",
  SESSION: "passtime_session",
} as const;
