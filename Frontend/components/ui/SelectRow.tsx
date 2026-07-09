import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type SelectOption = { value: string; label: string };

export type SelectRowProps = {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

/** Labeled dropdown row opening a themed bottom-sheet picker (same pattern as PhoneInput). */
export function SelectRow({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  error,
  disabled,
}: SelectRowProps) {
  const [open, setOpen] = useState(false);
  const { palette } = useThemeColors();
  const selected = options.find((o) => o.value === value);

  return (
    <View className="mb-5">
      <Text className="text-base text-black dark:text-white mb-2">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        className={`h-[52px] bg-white dark:bg-[#1a1a1a] border rounded-[8px] px-4 flex-row items-center justify-between ${
          error ? "border-red-500" : "border-[#d1d5dc] dark:border-[#333333]"
        }`}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Text className={`text-base ${selected ? "text-[#1a1a1a] dark:text-white" : "text-[#aaa] dark:text-[#777]"}`}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={palette.textMuted} />
      </Pressable>
      {error ? <Text className="text-sm text-red-500 mt-1">{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable
            className="bg-white dark:bg-[#1a1a1a] rounded-t-[16px] px-5 pt-5 pb-8 max-h-[60%]"
            onPress={() => {}}
          >
            <Text className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-3">{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="py-3 flex-row items-center justify-between"
                  accessibilityRole="menuitem"
                >
                  <Text className="text-base text-[#1a1a1a] dark:text-white">{item.label}</Text>
                  {item.value === value ? <Check size={18} color={palette.accent} /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
