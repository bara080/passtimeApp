import { axiosInstance } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type { FeedResponse, SavePushTokenPayload } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const notificationsApi = {
  list: async (): Promise<FeedResponse> => unwrap(await axiosInstance.get("/notifications")),
  markRead: async (id: string): Promise<Record<string, never>> =>
    unwrap(await axiosInstance.patch(`/notifications/${id}/read`)),
  markAllRead: async (): Promise<{ updated: number }> =>
    unwrap(await axiosInstance.patch("/notifications/read-all")),
  clearAll: async (): Promise<{ deleted: number }> =>
    unwrap(await axiosInstance.delete("/notifications/clear-all")),
  // Keyed by token: two device rehydrations firing at once collapse to one
  // write, backing the server's $addToSet atomicity with client-side dedup.
  savePushToken: async (payload: SavePushTokenPayload): Promise<{ saved: boolean }> =>
    withSingleFlight(`push-token:${payload.token}`, async () =>
      unwrap(await axiosInstance.post("/notifications/push-token", payload))),
};

export * from "./types";
