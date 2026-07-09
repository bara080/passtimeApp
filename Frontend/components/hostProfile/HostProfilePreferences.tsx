import { View, Text, Pressable } from "react-native";
import { Globe, DollarSign, Monitor } from "lucide-react-native";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";

export type HostProfilePreferencesProps = {
  country: string;
  currency: string;
};

/** Country / Currency / Appearance card. Country + Currency are read-only stubs
 *  today — tap surfaces a "coming soon" toast. */
export function HostProfilePreferences({ country, currency }: HostProfilePreferencesProps) {
  const { palette, isDark } = useThemeColors();
  const toast = useToast();

  return (
    <View className="mb-6">
      <Text className="text-[13px] font-semibold mb-2 ml-1" style={{ color: palette.textMuted }}>
        Preferences
      </Text>
      <View
        className="rounded-[14px] overflow-hidden border"
        style={{ backgroundColor: isDark ? palette.surface : "#ffffff", borderColor: palette.border }}
      >
        <ReadonlyRow
          Icon={Globe}
          label="Country"
          value={country}
          onPress={() => toast.info("Coming soon", "Country switching arrives shortly.")}
        />
        <View className="h-px ml-4" style={{ backgroundColor: palette.border }} />
        <ReadonlyRow
          Icon={DollarSign}
          label="Currency"
          value={currency}
          disabled
          onPress={() => toast.info("Coming soon", "USD only for now.")}
        />
        <View className="h-px ml-4" style={{ backgroundColor: palette.border }} />
        <View className="px-4 py-3.5">
          <View className="flex-row items-center mb-3">
            <Monitor size={20} color={palette.textPrimary} />
            <Text className="text-[15px] ml-3 flex-1" style={{ color: palette.textPrimary }}>
              Appearance
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>
    </View>
  );
}

function ReadonlyRow({
  Icon,
  label,
  value,
  disabled,
  onPress,
}: {
  Icon: typeof Globe;
  label: string;
  value: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { palette } = useThemeColors();
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5" style={{ opacity: disabled ? 0.6 : 1 }}>
      <Icon size={20} color={palette.textPrimary} />
      <View className="ml-3 flex-1">
        <Text className="text-[11px]" style={{ color: palette.textMuted }}>{label}</Text>
        <Text className="text-[15px]" style={{ color: palette.textPrimary }}>{value}</Text>
      </View>
    </Pressable>
  );
}
