import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { authApi } from "@/services/auth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      router.push({ pathname: "/(auth)/forgot-password-verify", params: { email: trimmed } });
    } catch {
      // Server always returns success — any error is a network/server issue
      Alert.alert("Error", "Something went wrong. Please try again.");
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

        <Text className="text-[26px] font-semibold text-[#1a1a1a] mb-2">Forgot Password</Text>
        <Text className="text-base text-[#666] mb-8">
          Enter your email and we'll send you a 6-digit reset code.
        </Text>

        <View className="mb-6">
          <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
          />
        </View>

        <View className="mt-auto">
          <LinearGradient
            colors={["#ff9933", "#ff6633"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-[8px] overflow-hidden"
          >
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="h-[52px] items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">Send Reset Code</Text>
              )}
            </Pressable>
          </LinearGradient>

          <Pressable onPress={() => router.back()} className="mt-4 items-center">
            <Text className="text-base text-[#666]">Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
