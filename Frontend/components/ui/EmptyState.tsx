import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppButton } from "./AppButton";
import { useThemeColors } from "@/hooks/useThemeColors";

export type EmptyStateProps = {
  Icon: LucideIcon;
  heading: string;
  body: string;
  tip?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

/** Centered empty state: soft icon badge, accent heading, body, tip bar, CTA
 *  (layout per Figma 1288:6483 / 1288:6511 — illustration assets TBD). */
export function EmptyState({ Icon, heading, body, tip, ctaLabel, onCta }: EmptyStateProps) {
  const { palette, isDark } = useThemeColors();

  return (
    <View className="flex-1 px-[21px]">
      <View className="flex-1 items-center justify-center">
        <View
          className="w-[140px] h-[140px] rounded-full items-center justify-center mb-8"
          style={{ backgroundColor: isDark ? "#241a2e" : "#f3ecfb" }}
        >
          <Icon size={56} color={palette.accent} strokeWidth={1.3} />
        </View>
        <Text className="text-[22px] font-semibold text-center mb-3" style={{ color: palette.accent }}>
          {heading}
        </Text>
        <Text className="text-[15px] text-center leading-[22px] px-6" style={{ color: palette.textPrimary }}>
          {body}
        </Text>
      </View>
      <View className="pb-28">
        {tip ? (
          <Text className="text-[11px] text-center mb-3" style={{ color: palette.textMuted }}>
            Tip: {tip}
          </Text>
        ) : null}
        {ctaLabel && onCta ? <AppButton label={ctaLabel} onPress={onCta} /> : null}
      </View>
    </View>
  );
}
