import { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { ScreenHeader, AppButton } from "@/components/ui";
import { FormField } from "@/components/auth";
import { trackEvent } from "@/utils/analytics";

/** Simplified meet-up location screen (Figma has a 5-step map picker; deferred).
 *  v1 collects venue name + address, which is what the backend requires. */
export default function BookingVenueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hostUid: string; startAt: string; durationMinutes: string }>();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const valid = name.trim().length > 0 && address.trim().length > 0;

  const next = () => {
    trackEvent("booking.venue.filled", { hostUid: params.hostUid ?? "" });
    router.push({
      pathname: "/(app)/book/summary",
      params: {
        hostUid: params.hostUid ?? "",
        startAt: params.startAt ?? "",
        durationMinutes: params.durationMinutes ?? "60",
        venueName: name.trim(),
        venueAddress: address.trim(),
      },
    } as unknown as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-[21px] pb-8">
        <ScreenHeader title="Where would you like to meet?" subtitle="Enter the venue and address for the booking." />
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <FormField
            label="Venue"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Starbucks Reserve Roastery"
            autoCapitalize="words"
            maxLength={120}
          />
          <FormField
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city"
            autoCapitalize="words"
            maxLength={200}
          />
        </ScrollView>
        <AppButton label="Continue" onPress={next} disabled={!valid} />
      </View>
    </SafeAreaView>
  );
}
