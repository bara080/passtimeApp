import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthProvider";
import type { UserRole } from "@/services/auth/types";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    const ok = await login({ email: email.trim().toLowerCase(), password, role });
    setLoading(false);
    if (!ok) {
      Alert.alert("Login Failed", "Invalid email or password. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-[21px] pt-[79px] pb-8">
        {/* Back */}
        <Pressable onPress={() => router.back()} className="mb-6">
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="text-[26px] font-semibold text-[#1a1a1a] mb-2">Welcome back</Text>
        <Text className="text-base text-[#666] mb-8">Sign in to your account</Text>

        {/* Role toggle */}
        <View className="flex-row border border-[#d1d5dc] rounded-xl mb-6 overflow-hidden">
          {(["member", "host"] as UserRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              className={`flex-1 h-11 items-center justify-center ${
                role === r ? "bg-[#ff6633]" : "bg-white"
              }`}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  role === r ? "text-white" : "text-[#666]"
                }`}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Email */}
        <View className="mb-4">
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

        {/* Password */}
        <View className="mb-2">
          <Text className="text-sm font-medium text-[#1a1a1a] mb-2">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            secureTextEntry
            autoComplete="password"
            className="h-[52px] border border-[#d1d5dc] rounded-[8px] px-4 text-base text-[#1a1a1a]"
          />
        </View>

        <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="mb-8 self-end">
          <Text className="text-sm text-[#ff6633]">Forgot password?</Text>
        </Pressable>

        <View className="mt-auto">
          <LinearGradient
            colors={["#ff9933", "#ff6633"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-[8px] overflow-hidden"
          >
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className="h-[52px] items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">Sign In</Text>
              )}
            </Pressable>
          </LinearGradient>

          <View className="flex-row justify-center mt-4 gap-1">
            <Text className="text-base text-[#666]">Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-base text-[#ff6633] underline">Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
