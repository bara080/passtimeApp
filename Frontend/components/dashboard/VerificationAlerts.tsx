import { View, Text, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import { AlertTriangle, Info } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import type { DashboardVerification } from "@/services/hostDashboard/types";

export type VerificationAlertsProps = {
  verification: DashboardVerification;
};

/** Two amber warning cards — profile and bank. Only renders the ones that need
 *  the host's attention. Bank uses a soft "coming soon" tap per product call. */
export function VerificationAlerts({ verification }: VerificationAlertsProps) {
  const { palette, isDark } = useThemeColors();
  const toast = useToast();
  const router = useRouter();

  const bg = isDark ? "#2f210f" : "#fff3ec";
  const border = "#ff9933";
  const fg = palette.textPrimary;

  const showProfile = !verification.profile;
  const showBank = verification.bankStatus !== "verified";
  if (!showProfile && !showBank) return null;

  return (
    <View className="mb-4" style={{ gap: 8 }}>
      {showProfile ? (
        <Alert
          Icon={AlertTriangle}
          title="Profile verification"
          body="Please verify your profile to get bookings."
          bg={bg}
          border={border}
          fg={fg}
          muted={palette.textMuted}
          onPress={() => toast.info("Finish onboarding", "Complete the funnel to be discoverable.")}
        />
      ) : null}
      {showBank ? (
        <Alert
          Icon={Info}
          title="Bank Account verification"
          body="Please verify your bank account to receive payments."
          bg={bg}
          border={border}
          fg={fg}
          muted={palette.textMuted}
          onPress={() => router.push("/(app)/host/stripe-onboarding" as unknown as Href)}
        />
      ) : null}
    </View>
  );
}

type AlertRow = {
  Icon: typeof AlertTriangle;
  title: string;
  body: string;
  bg: string;
  border: string;
  fg: string;
  muted: string;
  onPress: () => void;
};

function Alert({ Icon, title, body, bg, border, fg, muted, onPress }: AlertRow) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start rounded-[12px] p-3 gap-3"
      style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}
    >
      <Icon size={20} color={border} strokeWidth={2} />
      <View className="flex-1">
        <Text className="text-[15px] font-semibold" style={{ color: fg }}>
          {title}
        </Text>
        <Text className="text-[12px] mt-0.5" style={{ color: muted }}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}
