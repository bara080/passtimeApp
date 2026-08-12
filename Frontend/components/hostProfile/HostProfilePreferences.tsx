import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, ActivityIndicator } from "react-native";
import { Globe, DollarSign, Monitor, Check, ChevronRight, X } from "lucide-react-native";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useToast } from "@/context/ToastProvider";
import { useAuth } from "@/context/AuthProvider";
import { authApi } from "@/services/auth";

// Small launch-market lists — extend as Passtime expands.
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "India",
];
const CURRENCIES = [
  { code: "usd", label: "USD — US Dollar" },
  { code: "cad", label: "CAD — Canadian Dollar" },
  { code: "gbp", label: "GBP — British Pound" },
  { code: "aud", label: "AUD — Australian Dollar" },
  { code: "eur", label: "EUR — Euro" },
  { code: "aed", label: "AED — UAE Dirham" },
  { code: "inr", label: "INR — Indian Rupee" },
];

export type HostProfilePreferencesProps = {
  /** Optional overrides; defaults to the signed-in user's saved values. */
  country?: string;
  currency?: string;
};

/** Country / Currency / Appearance card. Country + Currency are now editable and
 *  persist via PATCH /auth/me. */
export function HostProfilePreferences({ country: countryProp, currency: currencyProp }: HostProfilePreferencesProps) {
  const { palette, isDark } = useThemeColors();
  const toast = useToast();
  const { user, updateUser } = useAuth();

  const country = countryProp ?? user?.country ?? "United States";
  const currency = (currencyProp ?? user?.currency ?? "usd").toUpperCase();

  const [picker, setPicker] = useState<null | "country" | "currency">(null);
  const [saving, setSaving] = useState(false);

  const saveCountry = async (value: string) => {
    setPicker(null);
    setSaving(true);
    try {
      await authApi.updateProfile({ country: value });
      await updateUser({ country: value });
      toast.success("Country updated");
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const saveCurrency = async (code: string) => {
    setPicker(null);
    setSaving(true);
    try {
      await authApi.updateProfile({ currency: code });
      await updateUser({ currency: code });
      toast.success("Currency updated");
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-[13px] font-semibold mb-2 ml-1" style={{ color: palette.textMuted }}>
        Preferences
      </Text>
      <View
        className="rounded-[14px] overflow-hidden border"
        style={{ backgroundColor: isDark ? palette.surface : "#ffffff", borderColor: palette.border }}
      >
        <EditRow Icon={Globe} label="Country" value={country} onPress={() => setPicker("country")} saving={saving} />
        <View className="h-px ml-4" style={{ backgroundColor: palette.border }} />
        <EditRow Icon={DollarSign} label="Currency" value={currency} onPress={() => setPicker("currency")} saving={saving} />
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

      <PickerSheet
        visible={picker === "country"}
        title="Select country"
        onClose={() => setPicker(null)}
        data={COUNTRIES.map((c) => ({ key: c, label: c }))}
        selectedKey={country}
        onSelect={saveCountry}
        palette={palette}
        isDark={isDark}
      />
      <PickerSheet
        visible={picker === "currency"}
        title="Select currency"
        onClose={() => setPicker(null)}
        data={CURRENCIES.map((c) => ({ key: c.code, label: c.label }))}
        selectedKey={currency.toLowerCase()}
        onSelect={saveCurrency}
        palette={palette}
        isDark={isDark}
      />
    </View>
  );
}

type Pal = { textPrimary: string; textMuted: string; accent: string; border: string; surface: string };

function EditRow({
  Icon,
  label,
  value,
  onPress,
  saving,
}: {
  Icon: typeof Globe;
  label: string;
  value: string;
  onPress: () => void;
  saving: boolean;
}) {
  const { palette } = useThemeColors();
  return (
    <Pressable onPress={onPress} disabled={saving} className="flex-row items-center px-4 py-3.5">
      <Icon size={20} color={palette.textPrimary} />
      <View className="ml-3 flex-1">
        <Text className="text-[11px]" style={{ color: palette.textMuted }}>
          {label}
        </Text>
        <Text className="text-[15px]" style={{ color: palette.textPrimary }}>
          {value}
        </Text>
      </View>
      {saving ? <ActivityIndicator size="small" color={palette.accent} /> : <ChevronRight size={18} color={palette.textMuted} />}
    </Pressable>
  );
}

function PickerSheet({
  visible,
  title,
  onClose,
  data,
  selectedKey,
  onSelect,
  palette,
  isDark,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  data: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  palette: Pal;
  isDark: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onPress={onClose}>
        <Pressable
          className="rounded-t-[20px] pt-3 pb-8 max-h-[70%]"
          style={{ backgroundColor: isDark ? "#141414" : "#ffffff" }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text className="text-[17px] font-semibold" style={{ color: palette.textPrimary }}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={palette.textMuted} />
            </Pressable>
          </View>
          <FlatList
            data={data}
            keyExtractor={(i) => i.key}
            renderItem={({ item }) => {
              const active = item.key === selectedKey;
              return (
                <Pressable onPress={() => onSelect(item.key)} className="flex-row items-center justify-between px-5 py-3.5">
                  <Text className="text-[15px]" style={{ color: active ? palette.accent : palette.textPrimary }}>
                    {item.label}
                  </Text>
                  {active ? <Check size={18} color={palette.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
