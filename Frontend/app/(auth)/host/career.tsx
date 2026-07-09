import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, AppButton, TextInputBox } from "@/components/ui";
import { FormField } from "@/components/auth";
import { useSaveHostOnboarding } from "@/services/host/hooks";
import { useToast } from "@/context/ToastProvider";

export default function HostCareerRoute() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostOnboarding();
  const [professionalRole, setProfessionalRole] = useState("");
  const [bio, setBio] = useState("");

  const valid = professionalRole.trim().length > 0 && bio.trim().length > 0;

  const submit = async () => {
    try {
      await save.mutateAsync({
        professionalRole: professionalRole.trim(),
        bio: bio.trim(),
        step: "career",
      });
      router.push("/(auth)/host/availability");
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader title="Career Insights" />
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <FormField
            label="Professional Role"
            value={professionalRole}
            onChangeText={setProfessionalRole}
            placeholder="e.g. Chef, Personal Trainer"
            maxLength={80}
            autoCapitalize="words"
          />
          <TextInputBox
            label="Meet the Person Behind the Profile"
            value={bio}
            onChangeText={setBio}
            placeholder="Background Snapshot"
            maxLength={1000}
          />
        </ScrollView>
        <AppButton label="Continue" onPress={submit} loading={save.isPending} disabled={!valid} />
      </View>
    </SafeAreaView>
  );
}
