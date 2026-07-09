import { View, Text, Pressable, Image } from "react-native";
import { MapPin, Bell, User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type HomeHeaderProps = {
  /** Line under "Home" — city or saved address; falls back to a prompt. */
  addressLine?: string | null;
  avatarUrl?: string | null;
  onPressLocation?: () => void;
  onPressBell?: () => void;
  onPressAvatar?: () => void;
};

/** Home header: location block left, bell + avatar right (Figma 1288:6397). */
export function HomeHeader({ addressLine, avatarUrl, onPressLocation, onPressBell, onPressAvatar }: HomeHeaderProps) {
  const { palette } = useThemeColors();

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Pressable
        className="flex-row items-center gap-2 flex-1 mr-3"
        onPress={onPressLocation}
        accessibilityRole="button"
        accessibilityLabel="Change location"
      >
        <MapPin size={20} color={palette.textPrimary} />
        <View>
          <Text className="text-base font-semibold" style={{ color: palette.textPrimary }}>
            Home
          </Text>
          <Text className="text-xs" style={{ color: palette.textMuted }} numberOfLines={1}>
            {addressLine || "Set your location"}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-3">
        <Pressable onPress={onPressBell} hitSlop={8} accessibilityRole="button" accessibilityLabel="Notifications">
          <Bell size={22} color={palette.textPrimary} />
        </Pressable>
        <Pressable onPress={onPressAvatar} accessibilityRole="button" accessibilityLabel="Your profile">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-9 h-9 rounded-full" />
          ) : (
            <View className="w-9 h-9 rounded-full bg-[#f0f0f0] dark:bg-[#1a1a1a] items-center justify-center">
              <User size={18} color={palette.textMuted} />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
