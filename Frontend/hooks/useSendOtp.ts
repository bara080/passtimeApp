import { useMutation } from "@tanstack/react-query";
import { otpApi } from "@/services/otp";
import type { SendOtpPayload, VerifyOtpPayload } from "@/services/otp/types";

export function useSendOtpMutation() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => otpApi.sendOtp(payload),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => otpApi.verifyOtp(payload),
  });
}
