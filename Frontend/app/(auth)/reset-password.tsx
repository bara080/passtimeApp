import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { authApi } from "@/services/auth";

export default function ResetPasswordScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (!uid) {
      Alert.alert("Error", "Invalid reset link.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(uid, password);
      Alert.alert("Success", "Your password has been reset.", [
        { text: "Sign In", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not reset password.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-[21px] pt-[79px] pb-8">
        <Pressable onPress={() => router.back()} className="mb-6">
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="text-[26px] font-semibold text-[#1a1a1a] mb-2">Set new password</Text>
        <Text className="text-base text-[#666] mb-8">
          Choose a strong password for your account.
        </Text>

        <View className="gap-4 mb-6">
          <View>
            <Text className="text-sm font-medium text-[#1a1a1a] mb-2">New password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              placeholderTextColor="#aaa"
              secureTextEntry
              autoComplete="new-password"
              className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat your password"
              placeholderTextColor="#aaa"
              secureTextEntry
              autoComplete="new-password"
              className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
            />
          </View>
        </View>

        <View className="mt-auto">
          <LinearGradient
            colors={["#ff9933", "#ff6633"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-[8px] overflow-hidden"
          >
            <Pressable
              onPress={handleReset}
              disabled={loading}
              className="h-[52px] items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">Reset Password</Text>
              )}
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}
