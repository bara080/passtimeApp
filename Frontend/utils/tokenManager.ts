import { jwtDecode } from "jwt-decode";
import { router } from "expo-router";
import {
  getFromSecureStore,
  saveToSecureStore,
  clearFromSecureStore,
  SECURE_STORE_KEYS,
} from "./secureStore";
import { updateSession } from "./sessionManager";

type Decoded = { exp: number };
let refreshPromise: Promise<string> | null = null;
const CLOCK_SKEW_MS = 5_000;

function isTokenExpiring(token: string): boolean {
  try {
    const { exp } = jwtDecode<Decoded>(token);
    return Date.now() >= exp * 1000 - CLOCK_SKEW_MS;
  } catch {
    return true;
  }
}

function startRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenFromStorage().finally(() => (refreshPromise = null));
  }
  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = await getFromSecureStore(SECURE_STORE_KEYS.ACCESS_TOKEN);
  if (!token) return null;
  if (!isTokenExpiring(token)) return token;
  return startRefresh();
}

export async function forceRefreshAccessToken(): Promise<string> {
  return startRefresh();
}

async function refreshAccessTokenFromStorage(): Promise<string> {
  const rt = await getFromSecureStore(SECURE_STORE_KEYS.REFRESH_TOKEN);
  if (!rt) throw new Error("No refresh token available");

  // Lazy import to avoid circular dep
  const { authApi } = await import("../services/auth");
  const { accessToken, refreshToken: newRT } = await authApi.refreshToken(rt);

  await saveToSecureStore(SECURE_STORE_KEYS.ACCESS_TOKEN, String(accessToken));
  if (newRT) {
    await saveToSecureStore(SECURE_STORE_KEYS.REFRESH_TOKEN, String(newRT));
  }

  return accessToken;
}

export async function clearTokensAndLogout() {
  await clearFromSecureStore(SECURE_STORE_KEYS.ACCESS_TOKEN);
  await clearFromSecureStore(SECURE_STORE_KEYS.REFRESH_TOKEN);
  await clearFromSecureStore(SECURE_STORE_KEYS.SESSION);
  updateSession(null);
  router.replace("/(auth)/login");
}
