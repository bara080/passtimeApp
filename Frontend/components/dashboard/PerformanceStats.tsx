import { View, Text } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { DashboardPerformance } from "@/services/hostDashboard/types";

export type PerformanceStatsProps = {
  performance: DashboardPerformance;
};

/** Three big-number stat tiles (Figma v1/v2). */
export function PerformanceStats({ performance }: PerformanceStatsProps) {
  const { palette, isDark } = useThemeColors();
  const bg = isDark ? palette.surface : "#f4f4f5";
  return (
    <View className="mb-4">
      <Text className="text-[17px] font-semibold mb-3" style={{ color: palette.textPrimary }}>
        Your Performance
      </Text>
      <View className="flex-row" style={{ gap: 10 }}>
        <Stat n={performance.profileViews} label="Profile Views" bg={bg} fg={palette.textPrimary} />
        <Stat n={performance.bookingRequests} label="Booking Requests" bg={bg} fg={palette.textPrimary} />
        <Stat n={performance.acceptedBookings} label="Accepted Bookings" bg={bg} fg={palette.textPrimary} />
      </View>
    </View>
  );
}

function Stat({ n, label, bg, fg }: { n: number; label: string; bg: string; fg: string }) {
  return (
    <View className="flex-1 rounded-[12px] px-2 py-3 items-center" style={{ backgroundColor: bg }}>
      <Text className="text-[22px] font-bold" style={{ color: fg }}>
        {n}
      </Text>
      <Text className="text-[10px] mt-1 text-center" style={{ color: fg, opacity: 0.7 }}>
        {label}
      </Text>
    </View>
  );
}
