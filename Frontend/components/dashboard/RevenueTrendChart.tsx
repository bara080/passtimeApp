import { View, Text } from "react-native";
import Svg, { Polyline, Circle, Line as SvgLine, Rect, LinearGradient, Defs, Stop } from "react-native-svg";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { RevenuePoint } from "@/services/hostDashboard/types";

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 12;
const PAD_Y = 22;

function money(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export type RevenueTrendChartProps = {
  trend: RevenuePoint[];
};

/** 7-day revenue line chart. SVG only (no chart lib). Auto-scales to the
 *  window's peak; highlights the peak point with a callout. */
export function RevenueTrendChart({ trend }: RevenueTrendChartProps) {
  const { palette } = useThemeColors();
  if (!trend.length) return null;
  const max = Math.max(1, ...trend.map((t) => t.amount));
  const stepX = (WIDTH - PAD_X * 2) / Math.max(1, trend.length - 1);

  const points = trend.map((p, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_Y + (HEIGHT - PAD_Y * 2) * (1 - p.amount / max);
    return { x, y, amount: p.amount };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const peakIndex = points.reduce((best, p, i) => (p.amount > points[best].amount ? i : best), 0);
  const peak = points[peakIndex];

  return (
    <View className="mb-6 rounded-[12px] p-3" style={{ backgroundColor: palette.surface }}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Defs>
          <LinearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#ec407a" />
            <Stop offset="1" stopColor="#ff9933" />
          </LinearGradient>
        </Defs>
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
        <Polyline points={polyline} fill="none" stroke="url(#stroke)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={i === peakIndex ? 4 : 2.5} fill={i === peakIndex ? "#ff6633" : palette.accent} />
        ))}
        {peak.amount > 0 ? (
          <>
            <Rect
              x={Math.min(WIDTH - 70, Math.max(0, peak.x - 25))}
              y={Math.max(0, peak.y - 22)}
              width={54}
              height={18}
              rx={9}
              fill="#ff6633"
            />
          </>
        ) : null}
      </Svg>
      {peak.amount > 0 ? (
        <View
          className="absolute"
          style={{
            left: 12 + Math.min(WIDTH - 70, Math.max(0, peak.x - 25)),
            top: 12 + Math.max(0, peak.y - 22),
            width: 54,
            height: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
          pointerEvents="none"
        >
          <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "700" }}>{money(peak.amount)}</Text>
        </View>
      ) : null}
    </View>
  );
}
