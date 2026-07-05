import { axiosInstance, refreshAxiosInstance, API_BASE_URL } from "@/utils/httpClient";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RefreshResponse,
  AuthUser,
  UpdateProfilePayload,
} from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post("/auth/register", payload);
    return unwrap(res);
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await axiosInstance.post("/auth/login", payload);
    return unwrap(res);
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout");
  },

  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await refreshAxiosInstance.post("/auth/refresh-token", { refreshToken });
    return unwrap(res);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post("/auth/forgot-password", { email });
  },

  verifyResetCode: async (email: string, code: string): Promise<{ uid: string }> => {
    const res = await axiosInstance.post("/auth/verify-reset-code", { email, code });
    return unwrap<{ uid: string }>(res);
  },

  resetPassword: async (uid: string, newPassword: string): Promise<void> => {
    await axiosInstance.post("/auth/reset-password", { uid, newPassword });
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await axiosInstance.get("/auth/me");
    return unwrap(res);
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const res = await axiosInstance.patch("/auth/me", payload);
    return unwrap(res);
  },
};
