import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/auth";
import type { UpdateProfilePayload } from "@/services/auth/types";

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
  });
}
