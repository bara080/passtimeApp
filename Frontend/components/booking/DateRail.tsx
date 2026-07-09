import { View, Text, Pressable, ScrollView } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type DateRailProps = {
  /** ISO YYYY-MM-DD strings, chronological. */
  dates: string[];
  value: string | null;
  onChange: (iso: string) => void;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: String(d), month: MONTHS[m - 1] };
}

/** Horizontal date strip (Figma 1288:7631 top row): tap-to-select, accent underline for the picked day. */
export function DateRail({ dates, value, onChange }: DateRailProps) {
  const { palette } = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 20, paddingRight: 21 }}
      className="mb-4"
    >
      {dates.map((iso) => {
        const { day, month } = parts(iso);
        const active = iso === value;
        return (
          <Pressable
            key={iso}
            onPress={() => onChange(iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${month} ${day}`}
            className="items-center py-1"
          >
            <Text className="text-lg font-semibold" style={{ color: active ? palette.accent : palette.textPrimary }}>
              {day}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: active ? palette.accent : palette.textMuted }}>
              {month}
            </Text>
            {active ? <View style={{ height: 2, width: 22, backgroundColor: palette.accent, marginTop: 4, borderRadius: 1 }} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
