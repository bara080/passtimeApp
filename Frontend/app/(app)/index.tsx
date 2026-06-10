import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthProvider";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-2xl font-bold text-[#1a1a1a]">
          Hi, {user?.firstName || "there"} 👋
        </Text>
        <Text className="text-base text-[#666] mt-1 mb-6">
          {user?.role === "host" ? "Manage your experiences" : "Discover experiences near you"}
        </Text>

        {/* Placeholder content */}
        <View className="h-40 bg-[#f6f3f0] rounded-xl items-center justify-center">
          <Text className="text-[#999]">Featured experiences coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
