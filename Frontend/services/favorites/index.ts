import { axiosInstance } from "@/utils/httpClient";
import { withSingleFlight } from "@/utils/singleFlight";
import type { FavoritesResponse, ToggleFavoriteResponse } from "./types";

function unwrap<T>(res: { data: { status: number; message: string; data: T } }): T {
  if (res.data.status !== 0) throw new Error(res.data.message || "Request failed");
  return res.data.data;
}

export const favoritesApi = {
  list: async (): Promise<FavoritesResponse> => unwrap(await axiosInstance.get("/favorites")),

  // Keyed single-flight so a double-tapped heart shares one request; the server
  // upsert + unique index make the add idempotent regardless.
  add: async (hostUid: string): Promise<ToggleFavoriteResponse> =>
    withSingleFlight(`fav-add:${hostUid}`, async () =>
      unwrap(await axiosInstance.post(`/favorites/${hostUid}`))),

  remove: async (hostUid: string): Promise<ToggleFavoriteResponse> =>
    withSingleFlight(`fav-remove:${hostUid}`, async () =>
      unwrap(await axiosInstance.delete(`/favorites/${hostUid}`))),
};

export * from "./types";
