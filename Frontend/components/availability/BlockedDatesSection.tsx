import { View, Text } from "react-native";
import { X } from "lucide-react-native";
import { DateField } from "@/components/auth";
import { IconButton } from "@/components/ui";
import { useThemeColors } from "@/hooks/useThemeColors";

export type BlockedDatesSectionProps = {
  value: string[];
  onChange: (dates: string[]) => void;
};

/** Add blocked dates via the calendar field; list them with per-row remove. */
export function BlockedDatesSection({ value, onChange }: BlockedDatesSectionProps) {
  const { palette } = useThemeColors();

  const add = (iso: string) => {
    if (iso && !value.includes(iso)) onChange([...value, iso].sort());
  };
  const remove = (iso: string) => onChange(value.filter((d) => d !== iso));

  return (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-3" style={{ color: palette.textPrimary }}>
        Blocked dates
      </Text>
      <DateField label="Add a date you're unavailable" value="" onChange={add} placeholder="Select date" initialYearOffset={0} />
      {value.map((iso) => (
        <View
          key={iso}
          className="flex-row items-center justify-between border rounded-[8px] px-4 h-11 mb-2 bg-white dark:bg-[#1a1a1a]"
          style={{ borderColor: palette.border }}
        >
          <Text className="text-base" style={{ color: palette.textPrimary }}>
            {iso}
          </Text>
          <IconButton onPress={() => remove(iso)} accessibilityLabel={`Remove blocked date ${iso}`}>
            <X size={16} color={palette.textMuted} />
          </IconButton>
        </View>
      ))}
    </View>
  );
}
