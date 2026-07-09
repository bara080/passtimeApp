import { View, Text } from "react-native";
import Svg, { Rect, Line as SvgLine } from "react-native-svg";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { PerformanceDay } from "@/services/hostDashboard/types";

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 20;
const PAD_Y = 18;

export type PerformanceTrendChartProps = {
  trend: PerformanceDay[];
};

/** Dual-bar chart per day: profile views + bookings (Figma v1/v2).
 *  Simple SVG rects — no chart lib. */
export function PerformanceTrendChart({ trend }: PerformanceTrendChartProps) {
  const { palette, isDark } = useThemeColors();
  if (!trend.length) return null;
  const max = Math.max(1, ...trend.map((d) => Math.max(d.views, d.bookings)));
  const groupW = (WIDTH - PAD_X * 2) / trend.length;
  const barW = Math.min(10, (groupW - 6) / 2);

  return (
    <View className="mb-6 rounded-[12px] p-3" style={{ backgroundColor: palette.surface }}>
      <View className="flex-row items-center gap-3 mb-2 ml-1">
        <Legend color="#ff9933" label="Profile Views" fg={palette.textPrimary} />
        <Legend color="#ff6633" label="Bookings" fg={palette.textPrimary} />
      </View>
      <Svg width={WIDTH} height={HEIGHT}>
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <SvgLine
            key={i}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_Y + (HEIGHT - PAD_Y * 2) * r}
            y2={PAD_Y + (HEIGHT - PAD_Y * 2) * r}
            stroke={palette.border}
            strokeDasharray="2,4"
            strokeWidth={0.5}
          />
        ))}
        {trend.map((d, i) => {
          const gx = PAD_X + i * groupW + groupW / 2;
          const viewsH = ((HEIGHT - PAD_Y * 2) * d.views) / max;
          const booksH = ((HEIGHT - PAD_Y * 2) * d.bookings) / max;
          return (
            <React.Fragment key={i}>
              <Rect
                x={gx - barW - 1}
                y={HEIGHT - PAD_Y - viewsH}
                width={barW}
                height={viewsH}
                fill="#ff9933"
                rx={2}
              />
              <Rect
                x={gx + 1}
                y={HEIGHT - PAD_Y - booksH}
                width={barW}
                height={booksH}
                fill="#ff6633"
                rx={2}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View className="flex-row justify-around mt-1">
        {trend.map((d, i) => (
          <Text key={i} className="text-[10px]" style={{ color: palette.textMuted }}>
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Legend({ color, label, fg }: { color: string; label: string; fg: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text className="text-[10px]" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  );
}

// React fragment used inside Svg mapping — imported lazily at bottom so RN's
// bundler doesn't chatter about it above the component.
import * as React from "react";
