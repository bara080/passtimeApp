import { Text, Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";

export type CategoryCardProps = {
  label: string;
  Icon: LucideIcon;
  /** Tile background — solid brand color per category (design 1288:6397). */
  color: string;
  onPress: () => void;
};

/** Colored category tile: icon over two-line label, white foreground. */
export function CategoryCard({ label, Icon, color, onPress }: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${label}`}
      className="w-[124px] h-[124px] rounded-[14px] items-center justify-center gap-3 px-2"
      style={{ backgroundColor: color }}
    >
      <Icon size={34} color="#ffffff" strokeWidth={1.5} />
      <Text className="text-[13px] text-white text-center leading-4" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
