import { axiosInstance } from "@/utils/httpClient";
import type { AvailabilityDoc, HostOnboardingPayload, HostOnboardingResponse } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const hostApi = {
  saveOnboarding: async (payload: HostOnboardingPayload): Promise<HostOnboardingResponse> => {
    const res = await axiosInstance.patch("/host/onboarding", payload);
    return unwrap(res);
  },

  saveAvailability: async (doc: AvailabilityDoc): Promise<{ availability: AvailabilityDoc }> => {
    const res = await axiosInstance.put("/host/availability", doc);
    return unwrap(res);
  },
};

export * from "./types";
