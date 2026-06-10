import { axiosInstance } from "@/utils/httpClient";
import type {
  SendOtpPayload,
  VerifyOtpPayload,
  SendVerifyEmailPayload,
  VerifyEmailCodePayload,
  OtpResponse,
  VerifyEmailResponse,
} from "./types";

export const otpApi = {
  sendOtp: async (payload: SendOtpPayload): Promise<OtpResponse> => {
    const res = await axiosInstance.post("/auth/send-otp", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<OtpResponse> => {
    const res = await axiosInstance.post("/auth/verify-otp", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  sendVerifyEmail: async (payload: SendVerifyEmailPayload): Promise<OtpResponse> => {
    const res = await axiosInstance.post("/auth/send-verify-email", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },

  verifyEmailCode: async (payload: VerifyEmailCodePayload): Promise<VerifyEmailResponse> => {
    const res = await axiosInstance.post("/auth/verify-email-code", payload);
    if (res.data.status !== 0) throw new Error(res.data.message);
    return res.data.data;
  },
};
