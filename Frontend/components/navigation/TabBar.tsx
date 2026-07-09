import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Heart, MessageSquare, User, Search, type LucideIcon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useChats } from "@/context/ChatProvider";

const TAB_META: Record<string, { label: string; Icon: LucideIcon }> = {
  index: { label: "Home", Icon: Home },
  likes: { label: "Likes", Icon: Heart },
  messages: { label: "Messages", Icon: MessageSquare },
  profile: { label: "Profile", Icon: User },
};

/** Pill tab bar with orange active state + circular search FAB (Figma 1288:6397). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { palette } = useThemeColors();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => TAB_META[r.name]);
  const { unreadCount } = useChats();

  return (
    <View
      className="absolute left-0 right-0 flex-row items-center px-4 gap-3"
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
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              className={`items-center justify-center rounded-full px-4 py-1.5 ${focused ? "bg-[#ff6633]" : ""}`}
            >
              <View>
                <Icon size={20} color={focused ? "#ffffff" : palette.textMuted} />
                {route.name === "messages" && unreadCount > 0 ? (
                  <View
                    className="absolute -top-1 -right-1.5 rounded-full min-w-[16px] h-4 px-1 items-center justify-center"
                    style={{ backgroundColor: "#e53935" }}
                  >
                    <Text className="text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-[10px] mt-0.5" style={{ color: focused ? "#ffffff" : palette.textMuted }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => navigation.navigate("explore")}
        accessibilityRole="button"
        accessibilityLabel="Search"
        className="w-[52px] h-[52px] rounded-full items-center justify-center bg-white dark:bg-[#1a1a1a]"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Search size={22} color={palette.textPrimary} />
      </Pressable>
    </View>
  );
}
