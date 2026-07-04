import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthProvider";
import { otpApi } from "@/services/otp";
import type { UserRole } from "@/services/auth/types";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validRole: UserRole = role === "host" ? "host" : "member";

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const ok = await register({
      email: normalizedEmail,
      password,
      role: validRole,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    if (!ok) {
      setLoading(false);
      Alert.alert("Registration Failed", "Could not create your account. Please try again.");
      return;
    }
    try {
      await otpApi.sendVerifyEmail({ email: normalizedEmail, displayName: firstName.trim() });
    } catch {
      // Verify screen offers resend — don't block signup on a failed first send
    }
    setLoading(false);
    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email: normalizedEmail, displayName: firstName.trim(), flow: "signup" },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-[21px] pt-[79px] pb-8">
          <Pressable onPress={() => router.back()} className="mb-6">
            <ArrowLeft size={24} color="#1a1a1a" />
          </Pressable>

          <Text className="text-[26px] font-semibold text-[#1a1a1a] mb-1">
            Create {validRole === "host" ? "Host" : "Member"} Account
          </Text>
          <Text className="text-base text-[#666] mb-8">Fill in your details to get started</Text>

          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium text-[#1a1a1a] mb-2">First Name *</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor="#aaa"
                autoCapitalize="words"
                className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor="#aaa"
                autoCapitalize="words"
                className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Email *</Text>
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

            <View>
              <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Password *</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 characters"
                placeholderTextColor="#aaa"
                secureTextEntry
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
                onPress={handleRegister}
                disabled={loading}
                className="h-[52px] items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-semibold">Create Account</Text>
                )}
              </Pressable>
            </LinearGradient>

            <Text className="text-xs text-[#999] text-center mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
