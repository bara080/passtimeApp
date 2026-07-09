import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./index";

/** In-app notifications feed. Refetches on window focus to catch pushes received in the background. */
export function useNotificationsFeed(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.list,
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "list"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "list"] }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", "list"] }),
  });
}
