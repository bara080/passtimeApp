import { useState } from "react";
import { Alert, Platform } from "react-native";
import auth from "@react-native-firebase/auth";
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { useAuth } from "@/context/AuthProvider";
import type { UserRole } from "@/services/auth/types";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export type SocialProvider = "google" | "apple";

/**
 * Google/Apple sign-in via Firebase Auth → exchanges the Firebase ID token
 * at POST /auth/social for app JWTs. Apple is iOS-only.
 */
export function useSocialAuth(role: UserRole) {
  const { socialLogin } = useAuth();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const exchange = async (firebaseIdToken: string) => {
    const ok = await socialLogin({ idToken: firebaseIdToken, role });
    if (!ok) Alert.alert("Login failed", "Could not sign you in. Please try again.");
  };

  const signInWithGoogle = async () => {
    if (pending) return;
    setPending("google");
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // user cancelled
      const googleIdToken = response.data.idToken;
      if (!googleIdToken) throw new Error("Google did not return an ID token.");
      const credential = auth.GoogleAuthProvider.credential(googleIdToken);
      const { user } = await auth().signInWithCredential(credential);
      await exchange(await user.getIdToken());
    } catch (err: unknown) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert("Google sign-in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPending(null);
    }
  };

  const signInWithApple = async () => {
    if (pending || Platform.OS !== "ios") return;
    setPending("apple");
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) throw new Error("Apple did not return an identity token.");
      const credential = auth.AppleAuthProvider.credential(appleCredential.identityToken, rawNonce);
      const { user } = await auth().signInWithCredential(credential);
      await exchange(await user.getIdToken());
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Apple sign-in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPending(null);
    }
  };

  return { signInWithGoogle, signInWithApple, pending };
}
