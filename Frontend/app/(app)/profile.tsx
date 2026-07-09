import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthProvider";
import { User, LogOut } from "lucide-react-native";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { palette } = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0d0d0d]">
      <View className="flex-1 px-5 pt-8">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-[#f6f3f0] dark:bg-[#1a1a1a] items-center justify-center mb-3">
            <User size={40} color="#ff6633" />
          </View>
          <Text className="text-xl font-bold text-[#1a1a1a] dark:text-white">
            {user?.displayName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User"}
          </Text>
          <Text className="text-sm text-[#666] dark:text-[#9a9a9a] capitalize mt-1">{user?.role}</Text>
        </View>

        <View className="border border-[#f0f0f0] dark:border-[#333333] rounded-xl p-4 mb-4">
          <Text className="text-xs text-[#999] uppercase tracking-widest mb-1">Email</Text>
          <Text className="text-base text-[#1a1a1a] dark:text-white">{user?.email}</Text>
        </View>

        <View className="border border-[#f0f0f0] dark:border-[#333333] rounded-xl p-4 mb-4">
          <Text className="text-xs text-[#999] uppercase tracking-widest mb-3">Appearance</Text>
          <ThemeToggle />
        </View>

        <View className="mt-auto">
          <Pressable
            onPress={signOut}
            className="h-[52px] border border-[#d1d5dc] dark:border-[#333333] rounded-[8px] flex-row items-center justify-center gap-2"
          >
            <LogOut size={20} color={palette.textMuted} />
            <Text className="text-base text-[#666] dark:text-[#9a9a9a] font-medium">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
