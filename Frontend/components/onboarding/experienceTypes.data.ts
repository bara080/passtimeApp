import {
  UtensilsCrossed,
  Wallet,
  MessagesSquare,
  Dumbbell,
  Activity,
  Network,
  type LucideIcon,
} from "lucide-react-native";
import type { ExperienceTypeKey } from "@/services/host/types";

export type ExperienceTypeItem = {
  key: ExperienceTypeKey;
  label: string;
  Icon: LucideIcon;
};

/** Card catalog for the experience-type grid (Figma 1288:5594). */
export const EXPERIENCE_TYPES: ExperienceTypeItem[] = [
  { key: "dinner-companion", label: "Dinner Companion", Icon: UtensilsCrossed },
  { key: "event-partner", label: "Event Partner", Icon: Wallet },
  { key: "social-companion", label: "Social Companion", Icon: MessagesSquare },
  { key: "fitness-companion", label: "Fitness Companion", Icon: Dumbbell },
  { key: "activity-partner", label: "Activity Partner", Icon: Activity },
  { key: "networking-companion", label: "Networking Companion", Icon: Network },
];

const EXPERIENCE_BY_KEY = Object.fromEntries(
  EXPERIENCE_TYPES.map((e) => [e.key, e])
) as Record<ExperienceTypeKey, ExperienceTypeItem>;

/** Resolve a booking's category to its label + icon. Falls back to a neutral
 *  "Companion" label + chat icon when the category is missing (Requests /
 *  Schedule cards, Figma 1288:14959 / 1288:12871 use the category as the title). */
export function experienceMeta(key?: ExperienceTypeKey | null): ExperienceTypeItem {
  return (key && EXPERIENCE_BY_KEY[key]) || { key: "social-companion", label: "Companion", Icon: MessagesSquare };
}
