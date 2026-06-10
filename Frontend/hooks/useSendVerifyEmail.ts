import { useMutation } from "@tanstack/react-query";
import { otpApi } from "@/services/otp";
import type { SendVerifyEmailPayload, VerifyEmailCodePayload } from "@/services/otp/types";

export function useSendVerifyEmailMutation() {
  return useMutation({
    mutationFn: (payload: SendVerifyEmailPayload) => otpApi.sendVerifyEmail(payload),
  });
}

export function useVerifyEmailCodeMutation() {
  return useMutation({
    mutationFn: (payload: VerifyEmailCodePayload) => otpApi.verifyEmailCode(payload),
  });
}
