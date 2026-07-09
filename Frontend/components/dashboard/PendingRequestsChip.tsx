import { View, Text, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColors";

export type PendingRequestsChipProps = {
  count: number;
};

/** "You have N new booking requests · View" pill (Figma v1/v2). Tapping goes
 *  to the Requests tab. Hidden when there are no pending requests. */
export function PendingRequestsChip({ count }: PendingRequestsChipProps) {
  const router = useRouter();
  const { palette, isDark } = useThemeColors();
  if (count <= 0) return null;

  return (
    <Pressable
      onPress={() => router.push("/(app)/requests" as unknown as Href)}
      className="flex-row items-center justify-between rounded-[12px] px-3 py-3 mb-4 border"
      style={{
        borderColor: palette.border,
        backgroundColor: isDark ? palette.surface : "#ffffff",
      }}
    >
      <Text className="text-[14px]" style={{ color: palette.textPrimary }}>
        You have <Text style={{ fontWeight: "700" }}>{count}</Text> new booking request{count === 1 ? "" : "s"}
      </Text>
      <Text className="text-[13px]" style={{ color: palette.accent, fontWeight: "600" }}>
        View
      </Text>
    </Pressable>
  );
}
