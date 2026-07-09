// Discovery of OTHER hosts (member-facing). Self-service host actions
// (onboarding, availability) live in services/host — singular.
import { axiosInstance } from "@/utils/httpClient";
import type { DiscoverParams, DiscoverResponse } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const hostsApi = {
  discover: async (params: DiscoverParams): Promise<DiscoverResponse> => {
    const res = await axiosInstance.get("/host/discover", { params });
    return unwrap(res);
  },
};

export * from "./types";
