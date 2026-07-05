import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { AuthScreen, AuthTitle, FormField, GradientButton } from "@/components/auth";
import { authApi } from "@/services/auth";
import { isValidEmail } from "@/utils/validation";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      Alert.alert("Error", "Please enter a valid email address.");
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
    <AuthScreen>
      <AuthTitle
        title="Forgot password"
        description="Please enter your email to reset your account password."
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
      </View>

      <GradientButton label="Send verification code" onPress={handleSubmit} loading={loading} />
    </AuthScreen>
  );
}
