import { axiosInstance } from "@/utils/httpClient";
import type { HostDashboardResponse } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const hostDashboardApi = {
  get: async (): Promise<HostDashboardResponse> =>
    unwrap<HostDashboardResponse>(await axiosInstance.get("/host/dashboard")),
};

export * from "./types";
