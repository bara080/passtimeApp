import { View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, User } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { HostCard as HostCardData } from "@/services/hosts/types";

export type HostCardProps = {
  host: HostCardData;
  onPress: () => void;
  width?: number;
};

/** Discovery card: 4:5 photo, dark scrim, "Name, Age" + city line (Figma 1288:6397). */
export function HostCard({ host, onPress, width = 160 }: HostCardProps) {
  const { palette } = useThemeColors();
  const title = host.age ? `${host.displayName}, ${host.age}` : host.displayName;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${title}`}
      className="rounded-[14px] overflow-hidden bg-[#f0f0f0] dark:bg-[#1a1a1a]"
      style={{ width, aspectRatio: 0.8 }}
    >
      {host.photoUrl ? (
        <Image source={{ uri: host.photoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <User size={48} color={palette.textMuted} strokeWidth={1.2} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "45%", justifyContent: "flex-end", padding: 10 }}
      >
        <Text className="text-white text-[15px] font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {host.city ? (
          <View className="flex-row items-center gap-1 mt-0.5">
            <MapPin size={11} color="#ffffff" />
            <Text className="text-white text-[11px]" numberOfLines={1}>
              {host.city}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}
