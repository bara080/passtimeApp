import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  MessageSquare,
  MessageSquareMore,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useChats } from "@/context/ChatProvider";

// 5 tabs, no floating search FAB (Figma 1288:12106).
const TAB_META: Record<string, { label: string; Icon: LucideIcon }> = {
  dashboard: { label: "Dashboard", Icon: LayoutDashboard },
  schedule: { label: "Schedule", Icon: CalendarDays },
  requests: { label: "Requests", Icon: Inbox },
  messages: { label: "Messages", Icon: MessageSquare },
  profile: { label: "Profile", Icon: User },
};

const HIDE_TAB_BAR_ON = new Set([
  "chat/[chatId]",
  "bookings/[bookingId]",
  "book/[hostUid]",
  "book/venue",
  "book/summary",
  "notifications",
]);

/** Host-specific tab bar: Dashboard · Schedule · Requests · Messages · Profile (no search FAB). */
export function HostTabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useThemeColors();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => TAB_META[r.name]);
  const { unreadCount } = useChats();

  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName && HIDE_TAB_BAR_ON.has(activeRouteName)) return null;

  return (
    <View
      className="absolute left-0 right-0 flex-row items-center px-4"
      style={{ bottom: Math.max(insets.bottom, 12) }}
    >
      <View
        className="flex-1 flex-row items-center justify-between rounded-full px-2 py-2 bg-white dark:bg-[#1a1a1a]"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {visibleRoutes.map((route) => {
          const { label, Icon } = TAB_META[route.name];
          const focused = state.routes[state.index].key === route.key;
          const hasUnread = route.name === "messages" && unreadCount > 0;
          const RenderIcon = hasUnread && !focused ? MessageSquareMore : Icon;
          const iconColor = focused
            ? "#ffffff"
            : hasUnread
              ? palette.accent
              : palette.textMuted;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={hasUnread ? `${label}, ${unreadCount} unread` : label}
              className={`items-center justify-center rounded-full px-3 py-1.5 ${focused ? "bg-[#ff6633]" : ""}`}
            >
              <View>
                <RenderIcon size={20} color={iconColor} strokeWidth={hasUnread ? 2.5 : 2} />
                {hasUnread ? (
                  <View
                    className="absolute -top-1.5 -right-2 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center border-2 border-white dark:border-[#1a1a1a]"
                    style={{ backgroundColor: "#e53935" }}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className="text-[10px] mt-0.5"
                style={{ color: iconColor, fontWeight: hasUnread ? "700" : "400" }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
