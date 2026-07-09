import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Phone, BadgeCheck, Camera, User as UserIcon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type HostProfileCoverProps = {
  displayName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  verified: boolean;
  /** When provided, an orange camera badge appears over the avatar and taps invoke it. */
  onPickAvatar?: () => void;
  uploadingAvatar?: boolean;
};

/** Cover banner + circular avatar + name (with verified check) + contact rows.
 *  Figma 1288:16092 (v1 not-verified vs v2 verified only differs by the badge). */
export function HostProfileCover({
  displayName,
  email,
  phoneNumber,
  avatarUrl,
  verified,
  onPickAvatar,
  uploadingAvatar,
}: HostProfileCoverProps) {
  const { palette, isDark } = useThemeColors();

  return (
    <View className="mb-4">
      <LinearGradient
        colors={["#ff9966", "#ffb347", "#a8e063", "#56ccf2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 130, borderRadius: 16 }}
      />
      <View className="flex-row items-end -mt-10 px-3">
        <Pressable
          onPress={onPickAvatar}
          disabled={!onPickAvatar || uploadingAvatar}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={{ position: "relative" }}
        >
          <View
            className="w-[86px] h-[86px] rounded-full overflow-hidden border-4 items-center justify-center"
            style={{ borderColor: isDark ? "#0d0d0d" : "#ffffff", backgroundColor: isDark ? palette.surface : "#f2f2f2" }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" />
            ) : (
              <UserIcon size={36} color={palette.accent} />
            )}
          </View>
          {onPickAvatar ? (
            <View
              style={{
                position: "absolute",
                right: 2,
                bottom: 2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#ff6633",
                borderWidth: 2,
                borderColor: isDark ? "#0d0d0d" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Camera size={14} color="#ffffff" strokeWidth={2.5} />
              )}
            </View>
          ) : null}
        </Pressable>
        <View className="ml-3 pb-2 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[22px] font-semibold" style={{ color: palette.textPrimary }} numberOfLines={1}>
              {displayName}
            </Text>
            {verified ? <BadgeCheck size={20} color="#22c55e" /> : null}
          </View>
        </View>
      </View>
      <View className="px-3 mt-3" style={{ gap: 6 }}>
        <ContactRow Icon={Mail} value={email} color={palette.textSecondary} />
        <ContactRow Icon={Phone} value={phoneNumber || "Add phone number"} color={palette.textSecondary} />
      </View>
    </View>
  );
}

function ContactRow({ Icon, value, color }: { Icon: typeof Mail; value: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon size={16} color={color} />
      <Text className="text-[14px]" style={{ color }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
