import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-xl font-semibold text-[#1a1a1a]">Explore</Text>
      <Text className="text-base text-[#999] mt-2">Map & search coming soon</Text>
    </SafeAreaView>
  );
}
