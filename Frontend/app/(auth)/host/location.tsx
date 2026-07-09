import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, AppButton } from "@/components/ui";
import { LocationForm, type LocationFormValue } from "@/components/onboarding/LocationForm";
import { useSaveHostOnboarding } from "@/services/host/hooks";
import { useToast } from "@/context/ToastProvider";

export default function HostLocationRoute() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostOnboarding();
  const [value, setValue] = useState<LocationFormValue>({
    country: null,
    state: null,
    city: "",
    address: "",
  });

  const valid =
    Boolean(value.country && value.state) &&
    value.city.trim().length > 0 &&
    value.address.trim().length > 0;

  const submit = async () => {
    if (!value.country || !value.state) return;
    try {
      await save.mutateAsync({
        location: {
          country: value.country,
          state: value.state,
          city: value.city.trim(),
          address: value.address.trim(),
        },
        step: "location",
      });
      router.push("/(auth)/host/career");
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader title="Your location" />
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <LocationForm value={value} onChange={setValue} />
        </ScrollView>
        <AppButton label="Continue" onPress={submit} loading={save.isPending} disabled={!valid} />
      </View>
    </SafeAreaView>
  );
}
