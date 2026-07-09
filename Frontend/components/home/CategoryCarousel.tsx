import { FlatList } from "react-native";
import { CategoryCard } from "./CategoryCard";
import { EXPERIENCE_TYPES } from "@/components/onboarding";
import type { ExperienceTypeKey } from "@/services/host/types";

/** Tile colors per category, sampled from the home design (1288:6397). */
const CATEGORY_COLORS: Record<ExperienceTypeKey, string> = {
  "dinner-companion": "#ff5722",
  "event-partner": "#ff9800",
  "social-companion": "#7cb342",
  "fitness-companion": "#26a69a",
  "activity-partner": "#7e57c2",
  "networking-companion": "#42a5f5",
};

export type CategoryCarouselProps = {
  onSelect: (key: ExperienceTypeKey) => void;
};

/** Horizontal "Explore by categories" strip — reuses the shared experience catalog. */
export function CategoryCarousel({ onSelect }: CategoryCarouselProps) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={EXPERIENCE_TYPES}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{ gap: 12, paddingRight: 21 }}
      renderItem={({ item }) => (
        <CategoryCard
          label={item.label}
          Icon={item.Icon}
          color={CATEGORY_COLORS[item.key]}
          onPress={() => onSelect(item.key)}
        />
      )}
    />
  );
}
