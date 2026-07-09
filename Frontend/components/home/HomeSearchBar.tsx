import { Text, Pressable } from "react-native";
import { Search } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type HomeSearchBarProps = {
  onPress: () => void;
  placeholder?: string;
};

/** Non-editing search pill — tapping navigates to the search screen. */
export function HomeSearchBar({ onPress, placeholder = "Search hosts, experiences, interests…" }: HomeSearchBarProps) {
  const { palette } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search"
      className="flex-row items-center gap-3 h-12 rounded-full px-4 mb-6 bg-[#f4f4f5] dark:bg-[#1a1a1a] border border-transparent dark:border-[#333333]"
    >
      <Search size={18} color={palette.textMuted} />
      <Text className="text-base" style={{ color: palette.placeholder }}>
        {placeholder}
      </Text>
    </Pressable>
  );
}
