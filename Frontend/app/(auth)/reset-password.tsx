import { useState } from "react";
import { Alert, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthScreen, AuthTitle, FormField, GradientButton } from "@/components/auth";
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
      router.replace({
        pathname: "/(auth)/success",
        params: {
          title: "Success",
          message: "Your password has been successfully reset. Please go back to login and access your account.",
          buttonLabel: "Back to Login",
          next: "/(auth)/login",
        },
      });
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthTitle
        title="Reset password"
        description="Please enter your new password and confirm it to reset your account password."
      />

      <View className="flex-1 justify-center">
        <FormField
          label="Enter new password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <FormField
          label="Enter confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />
      </View>

      <GradientButton label="Reset Password" onPress={handleReset} loading={loading} />
    </AuthScreen>
  );
}
