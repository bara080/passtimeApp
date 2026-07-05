import { useMutation } from "@tanstack/react-query";
import { mediaApi } from "@/services/media";

export function useAvatarUploadMutation() {
  return useMutation({
    mutationFn: (localUri: string) => mediaApi.uploadImage("avatar", localUri),
  });
}
