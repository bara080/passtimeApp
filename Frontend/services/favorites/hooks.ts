import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "./index";
import { trackEvent, trackError } from "@/utils/analytics";

const STALE_MS = 60 * 1000;

/** The member's saved hosts (list + count). */
export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesApi.list(),
    staleTime: STALE_MS,
  });
}

/** Convenience: a Set of favorited hostUids for O(1) membership checks on cards. */
export function useFavoriteIds() {
  const q = useFavorites();
  const ids = useMemo(() => new Set((q.data?.hosts ?? []).map((h) => h.uid)), [q.data]);
  return { ...q, ids };
}

/** Toggle a host's saved state. Pass the CURRENT state as `favorited` — the hook
 *  flips it (favorited → remove, else add). Invalidates the favorites cache. */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hostUid, favorited }: { hostUid: string; favorited: boolean }) => {
      trackEvent("favorite.toggle", { hostUid, favorited: !favorited });
      return favorited ? favoritesApi.remove(hostUid) : favoritesApi.add(hostUid);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
    onError: (err) => trackError("favorite.toggle", err),
  });
}
