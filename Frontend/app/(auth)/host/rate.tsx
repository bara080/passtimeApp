import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, type Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, AppButton } from "@/components/ui";
import { RateInput } from "@/components/onboarding/RateInput";
import { useSaveHostOnboarding } from "@/services/host/hooks";
import { useToast } from "@/context/ToastProvider";

export default function HostRateRoute() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostOnboarding();
  const [dollars, setDollars] = useState("");

  const valid = Number(dollars) >= 1 && Number(dollars) <= 1000;

  const submit = async () => {
    try {
      await save.mutateAsync({ hourlyRate: Number(dollars) * 100, step: "rate" });
      // Cast until the location route file lands and typed routes regenerate.
      router.push("/(auth)/host/location" as Href);
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-[21px] pb-8">
          <ScreenHeader title="Your rate" />
          <View className="flex-1 justify-center pb-20">
            <RateInput value={dollars} onChangeText={setDollars} />
          </View>
          <AppButton label="Continue" onPress={submit} loading={save.isPending} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
