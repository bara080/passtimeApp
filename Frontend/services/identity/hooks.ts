import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { identityApi } from "./index";
import type { SubmitIdentityPayload } from "./types";
import { trackEvent, trackError } from "@/utils/analytics";

/** Current identity-verification status for the signed-in user. */
export function useIdentity() {
  return useQuery({
    queryKey: ["identity"],
    queryFn: () => identityApi.status(),
    staleTime: 60 * 1000,
    select: (data) => data.identity,
  });
}

/** Submit documents for review → moves status to `pending`. */
export function useSubmitIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitIdentityPayload) => {
      trackEvent("identity.submit", { documentType: payload.documentType });
      return identityApi.submit(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["identity"] }),
    onError: (err) => trackError("identity.submit", err),
  });
}
