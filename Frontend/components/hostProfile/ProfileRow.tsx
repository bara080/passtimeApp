import { View, Text, Pressable } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ProfileRowBadge = "not_setup" | "verified" | "coming_soon";

export type ProfileRowProps = {
  Icon: LucideIcon;
  label: string;
  badge?: ProfileRowBadge;
  destructive?: boolean;
  onPress: () => void;
};

/** Single row: leading icon + label + optional status badge + chevron. */
export function ProfileRow({ Icon, label, badge, destructive, onPress }: ProfileRowProps) {
  const { palette } = useThemeColors();
  const fg = destructive ? "#c62828" : palette.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={20} color={fg} />
      <Text className="text-[15px] ml-3 flex-1" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
      {badge ? <Badge kind={badge} /> : null}
      <ChevronRight size={18} color={palette.textMuted} />
    </Pressable>
  );
}

function Badge({ kind }: { kind: ProfileRowBadge }) {
  const meta = {
    not_setup: { bg: "#fff3ec", fg: "#ff6633", label: "Not Setup yet" },
    verified: { bg: "#e6f7ec", fg: "#22a355", label: "Verified" },
    coming_soon: { bg: "#eef2ff", fg: "#4f46e5", label: "Coming soon" },
  }[kind];
  return (
    <View className="rounded-full px-2 py-0.5 mr-2" style={{ backgroundColor: meta.bg }}>
      <Text className="text-[10px] font-semibold" style={{ color: meta.fg }}>{meta.label}</Text>
    </View>
  );
}
