import { View, Text, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { DashboardEarnings } from "@/services/hostDashboard/types";

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export type EarningsTilesProps = {
  earnings: DashboardEarnings;
};

/** Three tile row: Today / This Week / This Month + "View Transactions" link. */
export function EarningsTiles({ earnings }: EarningsTilesProps) {
  const { palette, isDark } = useThemeColors();
  const router = useRouter();

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold" style={{ color: palette.textPrimary }}>
          Earnings
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/transactions" as unknown as Href)}
          hitSlop={8}
        >
          <Text className="text-[13px] font-semibold" style={{ color: palette.accent }}>
            View Transactions
          </Text>
        </Pressable>
      </View>
      <View className="flex-row" style={{ gap: 10 }}>
        <Tile amount={earnings.today} label="Today" bg={isDark ? palette.surface : "#f4f4f5"} fg={palette.textPrimary} />
        <Tile amount={earnings.thisWeek} label="This Week" bg={isDark ? palette.surface : "#f4f4f5"} fg={palette.textPrimary} />
        <Tile amount={earnings.thisMonth} label="This Month" bg={isDark ? palette.surface : "#f4f4f5"} fg={palette.textPrimary} />
      </View>
    </View>
  );
}

function Tile({ amount, label, bg, fg }: { amount: number; label: string; bg: string; fg: string }) {
  return (
    <View className="flex-1 rounded-[12px] px-3 py-3 items-center" style={{ backgroundColor: bg }}>
      <Text className="text-[20px] font-bold" style={{ color: fg }}>
        {money(amount)}
      </Text>
      <Text className="text-[11px] mt-1" style={{ color: fg, opacity: 0.7 }}>
        {label}
      </Text>
    </View>
  );
}
