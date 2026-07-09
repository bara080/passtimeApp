import { View, Text, Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type DurationStepperProps = {
  /** In hours (Figma shows "3 h"). Only whole-hour steps in v1. */
  value: number;
  min: number;
  max: number;
  onChange: (hours: number) => void;
};

/** "Select duration  [-  3 h  +]" control on the summary. */
export function DurationStepper({ value, min, max, onChange }: DurationStepperProps) {
  const { palette } = useThemeColors();
  const canDec = value > min;
  const canInc = value < max;

  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-[15px]" style={{ color: palette.textPrimary }}>
        Select duration
      </Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={() => canDec && onChange(value - 1)}
          disabled={!canDec}
          hitSlop={8}
          className="w-8 h-8 rounded-full items-center justify-center border"
          style={{ borderColor: palette.border, opacity: canDec ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Decrease duration"
        >
          <Minus size={16} color={palette.textPrimary} />
        </Pressable>
        <Text className="text-base font-semibold min-w-[36px] text-center" style={{ color: palette.textPrimary }}>
          {value} h
        </Text>
        <Pressable
          onPress={() => canInc && onChange(value + 1)}
          disabled={!canInc}
          hitSlop={8}
          className="w-8 h-8 rounded-full items-center justify-center border"
          style={{ borderColor: palette.border, opacity: canInc ? 1 : 0.4 }}
          accessibilityRole="button"
          accessibilityLabel="Increase duration"
        >
          <Plus size={16} color={palette.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
