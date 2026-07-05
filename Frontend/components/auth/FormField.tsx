import { View, Text, TextInput, type TextInputProps } from "react-native";

export type FormFieldProps = {
  label: string;
  /** Validation or server error shown under the input. */
  error?: string;
} & TextInputProps;

/** Labeled text input matching the auth design: 52px height, 8px radius, gray border. */
export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  return (
    <View className="mb-5">
      <Text className="text-base text-black mb-2">{label}</Text>
      <TextInput
        placeholderTextColor="#aaa"
        className={`h-[52px] bg-white border rounded-[8px] px-4 text-base text-[#1a1a1a] ${
          error ? "border-red-500" : "border-[#d1d5dc]"
        }`}
        {...inputProps}
      />
      {error ? <Text className="text-sm text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
