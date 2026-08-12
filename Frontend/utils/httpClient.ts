import axios from "axios";
import {
  getValidAccessToken,
  forceRefreshAccessToken,
  clearTokensAndLogout,
} from "./tokenManager";
import { getFromSecureStore, SECURE_STORE_KEYS } from "./secureStore";
import { needsIdempotencyKey, newIdempotencyKey } from "./idempotency";

export const APP_BASE_URL = (process.env.EXPO_PUBLIC_APP_BASE_URL ?? "").replace(/\/$/, "");
export const API_BASE_URL = `${APP_BASE_URL}/api`;

function normalizeApiPath(url?: string): string {
  if (!url) return "";
  return String(url).replace(API_BASE_URL, "").split("?")[0].replace(/\/$/, "") || "/";
}

function isRefreshTokenRequest(url?: string): boolean {
  const path = normalizeApiPath(url);
  return path.includes("/auth/refresh-token");
}

function isPublicAuthRequest(url?: string): boolean {
  const path = normalizeApiPath(url);
  const publicPaths = new Set([
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/verify-reset-code",
    "/auth/reset-password",
    "/auth/send-otp",
    "/auth/verify-otp",
    "/auth/send-verify-email",
    "/auth/verify-email-code",
    "/auth/verify-email-token",
  ]);
  return publicPaths.has(path);
}

console.log("[http] API_BASE_URL =", API_BASE_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // XHR adapter hangs on POST bodies on recent iOS simulator runtimes — use the
  // fetch adapter (native fetch works; empirically verified 2026-07-05)
  adapter: "fetch",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(async (config) => {
  console.log("[http] →", config.method?.toUpperCase(), config.url);
  const token = await getValidAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Idempotency-Key injection. Auto-generated for whitelisted POST routes so
  // callers get server-side dedup for free. If the caller already set a key
  // (e.g. to dedupe across separate user actions), respect it. The same key
  // is reused across our own retries (XHR fallback below, axios auto-retry)
  // because axios preserves the config object across attempts.
  // See /Users/bara080/bara/passtime/logout-idempotency.md.
  if (
    needsIdempotencyKey(config.method, config.url, API_BASE_URL) &&
    !config.headers["Idempotency-Key"]
  ) {
    config.headers["Idempotency-Key"] = newIdempotencyKey();
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Surface 4xx/5xx server envelopes in Metro so debugging validation errors
    // isn't a guessing game. Success payloads pass through untouched above.
    if (err?.response && __DEV__) {
      const status = err.response.status;
      const data = err.response.data;
      const msg = typeof data === "object" && data && "message" in data ? (data as { message?: string }).message : undefined;
      console.log(`[http] ✗ ${status}`, err?.config?.method?.toUpperCase(), err?.config?.url, "|", msg ?? JSON.stringify(data)?.slice(0, 200));
    }
    if (!err.response) {
      console.log(
        "[http] ✗ no-response error:",
        err?.message,
        "| code:", err?.code,
        "| url:", err?.config?.url,
        "| name:", err?.name
      );
      // iOS-simulator socket bug: in a bad run, fetch POSTs abort while XHR can
      // still get through (probe data 2026-07-05). Retry once on the XHR adapter
      // before declaring a network error. Harmless elsewhere — only fires when
      // the request never reached the server.
      const cfg = err?.config;
      if (cfg && !cfg.__xhrFallback) {
        cfg.__xhrFallback = true;
        cfg.adapter = "xhr";
        console.log("[http] ↻ transport fallback → XHR:", cfg.method?.toUpperCase(), cfg.url);
        try {
          return await axiosInstance(cfg);
        } catch (fallbackErr) {
          const fe = fallbackErr as { response?: unknown };
          if (fe?.response) throw fallbackErr;
          console.log("[http] ✗ XHR fallback also failed");
        }
      }
      return Promise.reject({
        status: 0,
        message: "Network error. Please check your connection.",
        data: null,
        isNetworkError: true,
      });
    }

    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshTokenRequest(originalRequest?.url)) {
        await clearTokensAndLogout();
        return Promise.reject(err);
      }

      if (isPublicAuthRequest(originalRequest?.url)) {
        return Promise.reject(err);
      }

      const refreshToken = await getFromSecureStore(SECURE_STORE_KEYS.REFRESH_TOKEN);
      if (!refreshToken?.trim()) {
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      try {
        const newToken = await forceRefreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        await clearTokensAndLogout();
        return Promise.reject(refreshErr);
      }
    }

    if (err.response?.status === 401) {
      await clearTokensAndLogout();
    }

    return Promise.reject(err);
  }
);

export const refreshAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  adapter: "fetch",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});
