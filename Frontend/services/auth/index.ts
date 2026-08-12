import { axiosInstance, refreshAxiosInstance, API_BASE_URL } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RefreshResponse,
  AuthUser,
  UpdateProfilePayload,
  SocialLoginPayload,
} from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const authApi = {
  // Single-flight: a double-tapped submit shares one in-flight request instead
  // of racing two registrations. Keyed by email so distinct users don't collide.
  register: async (payload: RegisterPayload): Promise<AuthResponse> =>
    withSingleFlight(`register:${payload.email.toLowerCase()}`, async () => {
      const res = await axiosInstance.post("/auth/register", payload);
      return unwrap(res);
    }),

  login: async (payload: LoginPayload): Promise<AuthResponse> =>
    withSingleFlight(`login:${payload.email.toLowerCase()}:${payload.role}`, async () => {
      const res = await axiosInstance.post("/auth/login", payload);
      return unwrap(res);
    }),

  // Single global key — the 401-cascade case from logout-idempotency.md. A burst
  // of logout taps collapses to one request; server treats it as idempotent 200.
  logout: async (): Promise<void> =>
    withSingleFlight("logout", async () => {
      await axiosInstance.post("/auth/logout");
    }),

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

  socialLogin: async (payload: SocialLoginPayload): Promise<AuthResponse> =>
    withSingleFlight(`social:${payload.provider}:${payload.role}`, async () => {
      const res = await axiosInstance.post("/auth/social", payload);
      return unwrap(res);
    }),
};
