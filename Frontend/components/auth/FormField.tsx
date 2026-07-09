import { View, Text, TextInput, type TextInputProps } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type FormFieldProps = {
  label: string;
  /** Validation or server error shown under the input. */
  error?: string;
} & TextInputProps;

/** Labeled text input matching the auth design: 52px height, 8px radius, gray border. */
export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  const { palette } = useThemeColors();
  return (
    <View className="mb-5">
      <Text className="text-base text-black dark:text-white mb-2">{label}</Text>
      <TextInput
        placeholderTextColor={palette.placeholder}
        className={`h-[52px] bg-white dark:bg-[#1a1a1a] border rounded-[8px] px-4 text-base text-[#1a1a1a] dark:text-white ${
          error ? "border-red-500" : "border-[#d1d5dc] dark:border-[#333333]"
        }`}
        {...inputProps}
      />
      {error ? <Text className="text-sm text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
