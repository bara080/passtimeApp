import { View, Text, TextInput, type TextInputProps } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type TextInputBoxProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  /** Show "n / maxLength" under the box. Default true when maxLength set. */
  showCounter?: boolean;
  error?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "multiline">;

/** Labeled multiline text area (bio-style) with optional character counter. */
export function TextInputBox({
  label,
  value,
  onChangeText,
  maxLength = 1000,
  showCounter = true,
  error,
  ...inputProps
}: TextInputBoxProps) {
  const { palette } = useThemeColors();

  return (
    <View className="mb-5">
      <Text className="text-base text-black dark:text-white mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        placeholderTextColor={palette.placeholder}
        className={`min-h-[160px] bg-white dark:bg-[#1a1a1a] border rounded-[8px] px-4 py-3 text-base text-[#1a1a1a] dark:text-white ${
          error ? "border-red-500" : "border-[#d1d5dc] dark:border-[#333333]"
        }`}
        {...inputProps}
      />
      <View className="flex-row justify-between mt-1">
        {error ? <Text className="text-sm text-red-500">{error}</Text> : <View />}
        {showCounter ? (
          <Text className="text-xs" style={{ color: palette.textMuted }}>
            {value.length} / {maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
