import { View } from "react-native";
import { ExperienceCard } from "./ExperienceCard";
import type { ExperienceTypeItem } from "./experienceTypes.data";

export type ExperienceGridProps = {
  items: ExperienceTypeItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
};

/** Two-column wrap layout of selectable experience cards. */
export function ExperienceGrid({ items, selected, onToggle }: ExperienceGridProps) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {items.map(({ key, label, Icon }) => (
        <ExperienceCard
          key={key}
          label={label}
          Icon={Icon}
          selected={selected.has(key)}
          onPress={() => onToggle(key)}
        />
      ))}
    </View>
  );
}
