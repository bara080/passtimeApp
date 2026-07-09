import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Monitor, Sun, Moon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  loadThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/utils/themePreference";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export type ThemeToggleProps = {
  /** Notified after the preference is applied and persisted. */
  onChange?: (pref: ThemePreference) => void;
};

/** Self-contained System/Light/Dark segmented control; persists via AsyncStorage. */
export function ThemeToggle({ onChange }: ThemeToggleProps) {
  const { palette } = useThemeColors();
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    loadThemePreference().then(setPref);
  }, []);

  const select = (value: ThemePreference) => {
    setPref(value);
    setThemePreference(value);
    onChange?.(value);
  };

  return (
    <View className="flex-row rounded-[10px] border border-[#d1d5dc] dark:border-[#333333] overflow-hidden">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = pref === value;
        return (
          <Pressable
            key={value}
            onPress={() => select(value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={`flex-1 h-11 flex-row items-center justify-center gap-1.5 ${
              active ? "bg-[#ff6633]" : "bg-white dark:bg-[#1a1a1a]"
            }`}
          >
            <Icon size={16} color={active ? "#ffffff" : palette.textMuted} />
            <Text className={`text-sm ${active ? "text-white" : "text-[#666] dark:text-[#9a9a9a]"}`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
