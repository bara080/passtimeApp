import { useState } from "react";
import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, AppButton } from "@/components/ui";
import { ExperienceGrid } from "./ExperienceGrid";
import { EXPERIENCE_TYPES } from "./experienceTypes.data";
import { useSaveHostOnboarding } from "@/services/host/hooks";
import type { ExperienceTypeKey } from "@/services/host/types";
import { useToast } from "@/context/ToastProvider";

/** Page logic for Figma 1288:5594 — multi-select experience types, min 1. */
export function ExperienceTypeScreen() {
  const router = useRouter();
  const toast = useToast();
  const save = useSaveHostOnboarding();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        experienceTypes: [...selected] as ExperienceTypeKey[],
        step: "experiences",
      });
      router.push("/(auth)/host/rate");
    } catch (err) {
      toast.error("Could not save", err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader
          title={"What kind of experiences\nyou offer"}
          subtitle="You can choose multiple options."
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <ExperienceGrid items={EXPERIENCE_TYPES} selected={selected} onToggle={toggle} />
        </ScrollView>
        <AppButton
          label="Continue"
          onPress={submit}
          loading={save.isPending}
          disabled={selected.size === 0}
        />
      </View>
    </SafeAreaView>
  );
}
