import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useNotificationsFeed } from "@/services/notifications/hooks";
import type { NotificationRecord } from "@/services/notifications/types";

type Ctx = {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  refetch: () => void;
};

const NotificationContext = createContext<Ctx>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refetch: () => {},
});

/** Wraps the feed query so the tab badge and screens share one source of truth. */
export function NotificationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const feed = useNotificationsFeed(Boolean(user));

  const refetch = useCallback(() => {
    feed.refetch();
  }, [feed]);

  const value = useMemo<Ctx>(
    () => ({
      notifications: feed.data?.notifications ?? [],
      unreadCount: feed.data?.unreadCount ?? 0,
      loading: feed.isPending,
      refetch,
    }),
    [feed.data, feed.isPending, refetch]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationContext);
}
