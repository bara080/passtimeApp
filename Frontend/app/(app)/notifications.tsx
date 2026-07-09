import { useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { MoreVertical, Bell, CheckCheck, Trash2, ArrowLeft } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui";
import type { Href as _Href } from "expo-router";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotifications } from "@/context/NotificationProvider";
import { useMarkAllRead, useClearAllNotifications, useMarkNotificationRead } from "@/services/notifications/hooks";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import type { NotificationRecord } from "@/services/notifications/types";
import { routeForNotificationData } from "@/utils/notificationRoutes";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { palette } = useThemeColors();
  const { notifications, loading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const clearAll = useClearAllNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = useMemo(() => {
    const today: NotificationRecord[] = [];
    const earlier: NotificationRecord[] = [];
    for (const n of notifications) (isToday(n.createdAt) ? today : earlier).push(n);
    return [
      today.length ? { title: "Today", data: today } : null,
      earlier.length ? { title: "Earlier", data: earlier } : null,
    ].filter(Boolean) as { title: string; data: NotificationRecord[] }[];
  }, [notifications]);

  const openItem = async (n: NotificationRecord) => {
    if (!n.isRead) markRead.mutate(n._id);
    const target = routeForNotificationData(n.type, n.data);
    if (target) router.push(target as unknown as Href);
    else toast.info(n.title, n.body);
  };

  const handleMarkAllRead = async () => {
    setMenuOpen(false);
    try {
      const r = await markAllRead.mutateAsync();
      toast.success(`Marked ${r.updated} as read`);
    } catch {
      toast.error("Could not mark all as read");
    }
  };
  const handleClearAll = async () => {
    setMenuOpen(false);
    try {
      const r = await clearAll.mutateAsync();
      toast.success(`Cleared ${r.deleted} notifications`);
    } catch {
      toast.error("Could not clear notifications");
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)" as unknown as _Href);
  };

  if (!loading && notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
        <View className="px-[21px] mt-6 mb-2">
          <Pressable onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={24} color={palette.textPrimary} />
          </Pressable>
        </View>
        <ScreenHeader title="Notifications" showBack={false} />
        <EmptyState
          Icon={Bell}
          heading="You're all caught up"
          body="You'll see booking updates and reminders here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="px-[21px] flex-row items-center gap-3 mt-6 mb-6">
        <Pressable onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={palette.textPrimary} />
        </Pressable>
        <Text className="text-[26px] flex-1" style={{ color: palette.textPrimary }}>Notifications</Text>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Notifications menu">
          <MoreVertical size={22} color={palette.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 21, paddingBottom: 40 }}
        data={sections.flatMap((s) => [{ __section: s.title }, ...s.data])}
        keyExtractor={(item, index) => ("__section" in item ? `s-${index}` : (item as NotificationRecord)._id)}
        renderItem={({ item }) => {
          if ("__section" in item) {
            return (
              <Text className="text-xs font-semibold mt-4 mb-2" style={{ color: palette.textMuted }}>
                {item.__section}
              </Text>
            );
          }
          const n = item as NotificationRecord;
          return (
            <Pressable
              onPress={() => openItem(n)}
              className="flex-row items-start gap-3 py-3 border-b"
              style={{ borderColor: palette.border }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center bg-[#fff3ec] dark:bg-[#33200f]">
                <Bell size={18} color={palette.accent} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[15px] font-semibold flex-1" numberOfLines={1} style={{ color: palette.textPrimary }}>
                    {n.title}
                  </Text>
                  {!n.isRead ? <View className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.accent }} /> : null}
                </View>
                <Text className="text-sm mt-0.5" numberOfLines={2} style={{ color: palette.textSecondary }}>
                  {n.body}
                </Text>
                <Text className="text-xs mt-1" style={{ color: palette.textMuted }}>
                  {relativeTime(n.createdAt)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#ff6633" />}
      />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setMenuOpen(false)}>
          <Pressable
            onPress={() => {}}
            className="absolute right-5 top-24 rounded-[12px] w-[220px] py-2 bg-white dark:bg-[#1a1a1a]"
            style={{ shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
          >
            <MenuItem Icon={CheckCheck} label="Mark all as read" onPress={handleMarkAllRead} />
            <MenuItem Icon={Trash2} label="Clear all" onPress={handleClearAll} destructive />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({
  Icon,
  label,
  onPress,
  destructive,
}: {
  Icon: typeof CheckCheck;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { palette } = useThemeColors();
  const color = destructive ? "#c62828" : palette.textPrimary;
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3">
      <Icon size={18} color={color} />
      <Text className="text-[15px]" style={{ color }}>{label}</Text>
    </Pressable>
  );
}
