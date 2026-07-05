import { useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, FormField, GradientButton, SocialAuthRow, FooterLink } from "@/components/auth";
import { useAuth } from "@/context/AuthProvider";
import { otpApi } from "@/services/otp";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { isValidEmail } from "@/utils/validation";
import type { UserRole } from "@/services/auth/types";

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validRole: UserRole = role === "host" ? "host" : "member";
  const { signInWithGoogle, signInWithApple, pending } = useSocialAuth(validRole);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const ok = await register({ email: normalizedEmail, password, role: validRole });
    if (!ok) {
      setLoading(false);
      Alert.alert("Registration Failed", "Could not create your account. Please try again.");
      return;
    }
    try {
      await otpApi.sendVerifyEmail({ email: normalizedEmail });
    } catch {
      // Verify screen offers resend — don't block signup on a failed first send
    }
    setLoading(false);
    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email: normalizedEmail, flow: "signup" },
    });
  };

  return (
    <AuthScreen>
      <AuthTitle
        title="Let’s get started"
        subtitle={`Create a ${validRole} account`}
        description="We just have a few steps to create and setup your profile."
      />

      <View className="flex-1 justify-center">
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
          autoComplete="new-password"
        />
        <View className="mt-2">
          <GradientButton label="Verify email" onPress={handleRegister} loading={loading} />
        </View>
        <SocialAuthRow context="Sign up" onGoogle={signInWithGoogle} onApple={signInWithApple} pending={pending} />
      </View>

      <FooterLink
        prompt="Already have an account?"
        action="Login"
        onPress={() => router.push("/(auth)/login")}
      />
    </AuthScreen>
  );
}
