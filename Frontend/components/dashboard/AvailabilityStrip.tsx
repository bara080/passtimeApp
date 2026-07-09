import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import type { AvailabilityDay } from "@/services/hostDashboard/types";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayNum(iso: string): string {
  const d = new Date(iso);
  return String(d.getDate()).padStart(2, "0");
}
function monthShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short" });
}
function weekday(iso: string): string {
  return WEEKDAY[new Date(iso).getDay()];
}

export type AvailabilityStripProps = {
  days: AvailabilityDay[];
};

/** Row of 7 mini day chips + "Today" details below (Figma v1/v2). */
export function AvailabilityStrip({ days }: AvailabilityStripProps) {
  const { palette, isDark } = useThemeColors();
  const toast = useToast();
  if (!days.length) return null;

  const today = days[0];
  const todayLabel = today
    ? `Today - ${weekday(today.date)}, ${dayNum(today.date)} ${monthShort(today.date)}`
    : "";

  const windowsLine = today?.enabled && today.windows.length > 0
    ? today.windows.join(", ")
    : "Not available";

  return (
    <View className="mb-8">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold" style={{ color: palette.textPrimary }}>
          Your this week availability
        </Text>
        <Pressable
          onPress={() => toast.info("Change availability", "Head to Profile → Availability.")}
          hitSlop={8}
        >
          <Text className="text-[13px] font-semibold" style={{ color: palette.accent }}>
            Change
          </Text>
        </Pressable>
      </View>
      <View className="flex-row justify-between mb-3">
        {days.map((d, i) => {
          const active = i === 0;
          const disabled = !d.enabled;
          return (
            <View
              key={d.date}
              className="items-center py-2 px-2 rounded-[10px]"
              style={{
                backgroundColor: active ? "#fff3ec" : "transparent",
                opacity: disabled && !active ? 0.35 : 1,
              }}
            >
              <Text
                className="text-[15px] font-semibold"
                style={{ color: active ? palette.accent : palette.textPrimary }}
              >
                {dayNum(d.date)}
              </Text>
              <Text
                className="text-[10px]"
                style={{ color: active ? palette.accent : palette.textMuted }}
              >
                {monthShort(d.date)}
              </Text>
              {disabled ? (
                <View style={{ width: 3, height: 3, borderRadius: 2, marginTop: 2, backgroundColor: palette.textMuted }} />
              ) : (
                <View style={{ width: 3, height: 3, marginTop: 2 }} />
              )}
            </View>
          );
        })}
      </View>
      <View
        className="flex-row items-center justify-between rounded-[10px] p-3"
        style={{ backgroundColor: isDark ? palette.surface : "#fafafa" }}
      >
        <Text className="text-[13px]" style={{ color: palette.accent, fontWeight: "600" }}>
          {todayLabel}
        </Text>
        <Text
          className="text-[13px]"
          style={{ color: today?.enabled ? palette.textPrimary : palette.textMuted }}
        >
          {windowsLine}
        </Text>
      </View>
    </View>
  );
}
