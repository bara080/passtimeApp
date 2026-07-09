import { View, Text, TextInput } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type RateInputProps = {
  /** Whole dollars as typed, digits only. */
  value: string;
  onChangeText: (digits: string) => void;
  caption?: string;
  autoFocus?: boolean;
};

/** Large centered `$ N` entry with caption (Figma 1288:5104). */
export function RateInput({ value, onChangeText, caption = "per hour", autoFocus = true }: RateInputProps) {
  const { palette } = useThemeColors();

  return (
    <View className="items-center">
      <View className="flex-row items-end justify-center gap-2">
        <Text className="text-[32px] pb-1" style={{ color: palette.textPrimary }}>
          $
        </Text>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          autoFocus={autoFocus}
          placeholder="50"
          placeholderTextColor={palette.placeholder}
          className="text-[44px] min-w-[80px] text-center border-b pb-1"
          style={{ color: palette.textPrimary, borderBottomColor: palette.border }}
          accessibilityLabel={`Rate in dollars ${caption}`}
        />
      </View>
      <Text className="text-sm mt-2" style={{ color: palette.textMuted }}>
        {caption}
      </Text>
    </View>
  );
}
