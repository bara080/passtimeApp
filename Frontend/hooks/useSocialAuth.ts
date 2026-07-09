import { useState } from "react";
import { Platform } from "react-native";
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/context/ToastProvider";
import type { UserRole } from "@/services/auth/types";

/**
 * Social sign-in (Google + Apple).
 *
 * Architecture: the RAW provider token (Google `idToken` / Apple `identityToken`)
 * is sent to `POST /auth/social`, where the backend verifies it directly against
 * the provider (google-auth-library / Apple JWKS). There is deliberately NO
 * client-side Firebase `signInWithCredential` hop:
 *   - media uploads use backend-signed URLs, so no Firebase client session is needed
 *   - it removes a network dependency that fails on fresh iOS simulator runtimes
 *     (`auth/network-request-failed`)
 * Pattern proven in the Zinga app.
 */

/** Google OAuth WEB client (client_type 3) — the audience the backend verifies against. */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
/** Google OAuth iOS client — required on iOS; without it the auth sheet dismisses as "cancelled". */
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

console.log(
  "[SocialAuth] configure — webClientId:",
  WEB_CLIENT_ID ? `${WEB_CLIENT_ID.slice(0, 20)}…` : "MISSING!",
  "| iosClientId:",
  IOS_CLIENT_ID ? `${IOS_CLIENT_ID.slice(0, 20)}…` : "MISSING!"
);

// Module-level: must run once before any signIn() call.
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  offlineAccess: true,
});

export type SocialProvider = "google" | "apple";

/**
 * Hook exposing the two provider flows for a given account role.
 *
 * @param role - cluster the account lives in ("member" | "host"); required by the
 *               backend because the same email can hold one account per role.
 * @returns `signInWithGoogle` / `signInWithApple` (fire-and-handle; session is
 *          persisted via AuthProvider on success, so the route guard navigates
 *          automatically) and `pending` (which provider is mid-flight, for button
 *          spinners / disabling).
 *
 * Failure semantics: user cancellations return silently; real failures surface
 * as an error toast. Nothing throws to the caller.
 */
export function useSocialAuth(role: UserRole) {
  const { socialLogin } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  /**
   * Exchanges a verified-by-provider token for app JWTs via AuthProvider.socialLogin,
   * which persists the session (secure store + tracker identify) on success.
   */
  const exchange = async (provider: SocialProvider, idToken: string) => {
    console.log(`[SocialAuth] exchanging ${provider} token with backend (len: ${idToken.length})`);
    const result = await socialLogin({ provider, idToken, role });
    console.log("[SocialAuth] backend exchange result:", result.ok);
    if (!result.ok) {
      toast.error("Login failed", result.message ?? "Could not sign you in. Please try again.");
    }
  };

  /**
   * Google flow: Play Services check → native account picker → `idToken` → backend.
   * Known failure: code 10 (DEVELOPER_ERROR) on Android means the app's signing
   * SHA-1 + applicationId pair is not registered on the Firebase Android app.
   */
  const signInWithGoogle = async () => {
    console.log("[SocialAuth] Google button pressed — role:", role, "pending:", pending);
    if (pending) return;
    setPending("google");
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log("[SocialAuth] calling GoogleSignin.signIn()…");
      const response = await GoogleSignin.signIn();
      console.log("[SocialAuth] signIn response type:", response.type);
      if (!isSuccessResponse(response)) {
        // v16 returns { type: "cancelled" } instead of throwing on user dismissal
        console.log("[SocialAuth] not successful:", JSON.stringify(response).slice(0, 200));
        return;
      }
      const idToken = response.data.idToken;
      console.log("[SocialAuth] Google idToken present:", !!idToken, "| user:", response.data.user?.email);
      if (!idToken) throw new Error("Google did not return an ID token.");
      await exchange("google", idToken);
    } catch (err: unknown) {
      const code = isErrorWithCode(err) ? err.code : (err as { code?: string })?.code;
      console.log("[SocialAuth] Google FAILED — code:", code, "|", err instanceof Error ? err.message : String(err));
      if (code === statusCodes.SIGN_IN_CANCELLED) return;
      toast.error("Google sign-in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPending(null);
    }
  };

  /**
   * Apple flow (iOS-only; the button is hidden on Android): native sheet →
   * `identityToken` (a JWT with audience = bundle id) → backend, which verifies
   * it against Apple's JWKS. Note: Apple exposes the user's name/email only on
   * the FIRST authorization — the backend treats them as optional.
   */
  const signInWithApple = async () => {
    console.log("[SocialAuth] Apple button pressed — role:", role, "platform:", Platform.OS);
    if (pending || Platform.OS !== "ios") return;
    setPending("apple");
    try {
      console.log("[SocialAuth] requesting Apple credential…");
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log("[SocialAuth] Apple identityToken present:", !!appleCredential.identityToken);
      if (!appleCredential.identityToken) throw new Error("Apple did not return an identity token.");
      await exchange("apple", appleCredential.identityToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.log("[SocialAuth] Apple FAILED — code:", code, "|", err instanceof Error ? err.message : String(err));
      if (code === "ERR_REQUEST_CANCELED") return;
      toast.error("Apple sign-in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPending(null);
    }
  };

  return { signInWithGoogle, signInWithApple, pending };
}
