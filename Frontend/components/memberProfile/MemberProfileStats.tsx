import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type MemberProfileStatsProps = {
  upcoming: number;
  completed: number;
  favorites: number;
};

/** Three-tile stats row for the member profile — mirrors the host stats block. */
export function MemberProfileStats({ upcoming, completed, favorites }: MemberProfileStatsProps) {
  const { palette, isDark } = useThemeColors();
  const cardBg = isDark ? palette.surface : "#ffffff";
  return (
    <View className="flex-row mb-6" style={{ gap: 10 }}>
      <Tile value={String(upcoming)} label="Upcoming" bg={cardBg} border={palette.border} fg={palette.textPrimary} muted={palette.textMuted} />
      <Tile value={String(completed)} label="Completed" bg={cardBg} border={palette.border} fg={palette.textPrimary} muted={palette.textMuted} />
      <Tile value={String(favorites)} label="Favorites" bg={cardBg} border={palette.border} fg={palette.textPrimary} muted={palette.textMuted} />
    </View>
  );
}

function Tile({
  value,
  label,
  bg,
  border,
  fg,
  muted,
}: {
  value: string;
  label: string;
  bg: string;
  border: string;
  fg: string;
  muted: string;
}) {
  return (
    <View
      className="flex-1 rounded-[12px] px-2 py-3 items-center border"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <Text className="text-[18px] font-bold" style={{ color: fg }}>{value}</Text>
      <Text className="text-[10px] text-center mt-1" style={{ color: muted }}>{label}</Text>
    </View>
  );
}
