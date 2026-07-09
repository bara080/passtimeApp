import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hostApi } from "./index";
import type { AvailabilityDoc, HostOnboardingPayload } from "./types";
import { trackEvent, trackError } from "@/utils/analytics";

/**
 * Saves one onboarding step. Tracks the full funnel across Sentry (breadcrumbs),
 * Vexo (product events) and LogRocket (session replay markers):
 *   host_onboarding.step.submit / .success / .error with the step name.
 */
export function useSaveHostOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HostOnboardingPayload) => {
      trackEvent("host_onboarding.step.submit", { step: payload.step });
      return hostApi.saveOnboarding(payload);
    },
    onSuccess: (data, payload) => {
      trackEvent("host_onboarding.step.success", {
        step: payload.step,
        complete: data.hostOnboardingComplete,
      });
      // Chain-resume reads onboarding state from /me — keep it fresh.
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err, payload) => {
      trackError("host_onboarding.step", err, { step: payload.step });
    },
  });
}

/** Saves the availability document. Same three-tracker funnel as onboarding steps. */
export function useSaveHostAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doc: AvailabilityDoc) => {
      trackEvent("host_onboarding.step.submit", { step: "availability" });
      return hostApi.saveAvailability(doc);
    },
    onSuccess: () => {
      trackEvent("host_onboarding.step.success", { step: "availability", complete: false });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      trackError("host_onboarding.step", err, { step: "availability" });
    },
  });
}
