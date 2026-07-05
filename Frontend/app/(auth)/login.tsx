import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { AuthScreen, AuthTitle, FormField, GradientButton, SocialAuthRow, FooterLink } from "@/components/auth";
import { useAuth } from "@/context/AuthProvider";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { isValidEmail } from "@/utils/validation";
import type { UserRole } from "@/services/auth/types";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, signInWithApple, pending } = useSocialAuth(role);

  const handleLogin = async () => {
    if (!isValidEmail(email) || !password) {
      Alert.alert("Error", "Please enter a valid email and your password.");
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
    <AuthScreen>
      <AuthTitle
        title="Login to your account"
        description="Please enter your email to login to your account."
      />

      <View className="flex-1 justify-center">
        {/* Role toggle — backend logins are per-role (not in the Figma design, functionally required) */}
        <View className="flex-row border border-[#d1d5dc] rounded-[8px] mb-6 overflow-hidden">
          {(["member", "host"] as UserRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              accessibilityRole="radio"
              accessibilityState={{ selected: role === r }}
              className={`flex-1 h-11 items-center justify-center ${role === r ? "bg-[#ff6633]" : "bg-white"}`}
            >
              <Text className={`text-sm capitalize ${role === r ? "text-white" : "text-[#666]"}`}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="items-end mb-5">
          <Text className="text-base text-[#ff6633]">Forgot Password?</Text>
        </Pressable>

        <GradientButton label="Login" onPress={handleLogin} loading={loading} />
        <SocialAuthRow context="Login" onGoogle={signInWithGoogle} onApple={signInWithApple} pending={pending} />
      </View>

      <FooterLink prompt="Don’t have an account?" action="Sign up" onPress={() => router.push("/(auth)/signup")} />
    </AuthScreen>
  );
}
