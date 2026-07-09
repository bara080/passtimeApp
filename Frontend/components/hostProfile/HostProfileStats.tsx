import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type HostProfileStatsProps = {
  bookingsCompleted: number;
  lifetimeEarningsCents: number;
  holdMoneyCents: number;
};

function money(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 10_000) return `$${Math.round(dollars / 1000)}K+`;
  if (dollars >= 1_000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

/** Three stat tiles below the cover — Bookings, Lifetime Earnings, Hold Money.
 *  Figma 1288:16092. */
export function HostProfileStats({ bookingsCompleted, lifetimeEarningsCents, holdMoneyCents }: HostProfileStatsProps) {
  const { palette, isDark } = useThemeColors();
  const cardBg = isDark ? palette.surface : "#ffffff";
  const border = palette.border;
  return (
    <View className="flex-row mb-6" style={{ gap: 10 }}>
      <Tile value={String(bookingsCompleted)} label="Bookings Completed" bg={cardBg} border={border} fg={palette.textPrimary} muted={palette.textMuted} />
      <Tile value={money(lifetimeEarningsCents)} label="Lifetime Earnings" bg={cardBg} border={border} fg={palette.textPrimary} muted={palette.textMuted} />
      <Tile value={money(holdMoneyCents)} label="Hold Money" bg={cardBg} border={border} fg={palette.textPrimary} muted={palette.textMuted} />
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
