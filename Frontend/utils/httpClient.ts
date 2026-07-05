import axios from "axios";
import {
  getValidAccessToken,
  forceRefreshAccessToken,
  clearTokensAndLogout,
} from "./tokenManager";
import { getFromSecureStore, SECURE_STORE_KEYS } from "./secureStore";

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
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!err.response) {
      console.log(
        "[http] ✗ no-response error:",
        err?.message,
        "| code:", err?.code,
        "| url:", err?.config?.url,
        "| name:", err?.name
      );
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
