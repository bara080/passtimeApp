import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type PropsWithChildren,
} from "react";
import { router, useSegments } from "expo-router";
import { isRunningInExpoGo } from "expo";
import * as Device from "expo-device";
import * as Sentry from "@sentry/react-native";
import LogRocket from "@logrocket/react-native";
import { identifyDevice } from "vexo-analytics";
import {
  saveToSecureStore,
  getFromSecureStore,
  clearSecureStore,
  SECURE_STORE_KEYS,
} from "@/utils/secureStore";
import { updateSession, type AuthSession } from "@/utils/sessionManager";
import { authApi } from "@/services/auth";
import type { AuthUser, LoginPayload, RegisterPayload, SocialLoginPayload } from "@/services/auth/types";

type AuthContextType = {
  initializing: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  socialLogin: (payload: Omit<SocialLoginPayload, "deviceInfo">) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  initializing: true,
  session: null,
  user: null,
  login: async () => false,
  register: async () => false,
  socialLogin: async () => ({ ok: false }),
  signOut: async () => {},
  setUser: () => {},
  updateUser: async () => {},
});

// Signup verification screens an authenticated user is allowed to stay on
const VERIFICATION_SCREENS = new Set([
  "verify-email",
  "verify-phone",
  "verify-otp",
  "success",
  "profile-details",
  "host", // (auth)/host/* — host onboarding funnel
]);

// Completed step (from /me) → the next route in the host funnel.
const HOST_STEP_ROUTES: Record<string, string> = {
  experiences: "/(auth)/host/rate",
  rate: "/(auth)/host/location",
  location: "/(auth)/host/career",
  career: "/(auth)/host/availability",
  availability: "/(auth)/host/photos",
  photos: "/(auth)/host/photos",
};

// First incomplete signup step for a user, or null when fully onboarded.
// Keeps the verification chain resumable after an app kill/relaunch.
function getIncompleteStep(user: AuthUser):
  | { pathname: string; params?: Record<string, string> }
  | null {
  if (!user.emailVerified) {
    return { pathname: "/(auth)/verify-email", params: { email: user.email, flow: "signup" } };
  }
  if (!user.phoneVerified) {
    return { pathname: "/(auth)/verify-phone", params: { flow: "signup" } };
  }
  if (!user.firstName) {
    return { pathname: "/(auth)/profile-details" };
  }
  if (user.role === "host" && !user.hostOnboardingComplete) {
    const step = user.hostOnboardingStep;
    return { pathname: (step && HOST_STEP_ROUTES[step]) || "/(auth)/host/experiences" };
  }
  return null;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  // True between register() succeeding and the signup verification chain
  // finishing — keeps the route guard from yanking the user out of (auth)
  // while they're still on the register screen waiting to navigate.
  const [pendingVerification, setPendingVerification] = useState(false);
  const segments = useSegments();

  // Restore session from secure store on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await getFromSecureStore(SECURE_STORE_KEYS.SESSION);
        if (raw) {
          const parsed = JSON.parse(raw) as AuthSession;
          setSession(parsed);
          setUser(parsed.user);
          updateSession(parsed);
          // Refresh verification/profile flags from the server — stored copies go stale
          authApi
            .getMe()
            .then(async (fresh) => {
              const merged = { ...parsed, user: { ...parsed.user, ...fresh } };
              setSession(merged);
              setUser(merged.user);
              updateSession(merged);
              await saveToSecureStore(SECURE_STORE_KEYS.SESSION, JSON.stringify(merged));
            })
            .catch(() => {
              // offline or expired session — keep the stored copy
            });
        }
      } catch {
        // corrupt session data — start fresh
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // Route guard: redirect unauthenticated users to /login, authenticated to /app
  useEffect(() => {
    console.log("[AuthProvider] guard — initializing:", initializing, "session:", !!session, "segments:", segments);
    if (initializing) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";
    if (!session && !inAuthGroup) {
      console.log("[AuthProvider] no session → redirecting to /(auth)");
      router.replace("/(auth)");
    } else if (session && inAuthGroup && (pendingVerification || VERIFICATION_SCREENS.has(segments[1] ?? ""))) {
      console.log("[AuthProvider] mid-verification — staying on", segments[1]);
    } else if (session) {
      const incomplete = getIncompleteStep(session.user);
      if (incomplete) {
        console.log("[AuthProvider] resuming verification chain →", incomplete.pathname);
        router.replace(incomplete as never);
      } else if (!inAppGroup) {
        console.log("[AuthProvider] session found → redirecting to /(app)");
        router.replace("/(app)");
      } else {
        if (pendingVerification) setPendingVerification(false);
        console.log("[AuthProvider] no redirect needed, staying on segment:", segments[0]);
      }
    } else {
      console.log("[AuthProvider] no redirect needed, staying on segment:", segments[0]);
    }
  }, [session, segments, initializing, pendingVerification]);

  const persistSession = useCallback(async (s: AuthSession) => {
    setSession(s);
    setUser(s.user);
    updateSession(s);
    Sentry.setUser({ id: s.uid, email: s.user.email });
    if (process.env.EXPO_PUBLIC_LOGROCKET_APP_ID && !isRunningInExpoGo()) {
      LogRocket.identify(s.uid, { email: s.user.email, role: s.role });
    }
    if (process.env.EXPO_PUBLIC_VEXO_API_KEY && !isRunningInExpoGo()) {
      identifyDevice(s.uid).catch(() => {});
    }
    await saveToSecureStore(SECURE_STORE_KEYS.SESSION, JSON.stringify(s));
    await saveToSecureStore(SECURE_STORE_KEYS.ACCESS_TOKEN, s.accessToken);
    await saveToSecureStore(SECURE_STORE_KEYS.REFRESH_TOKEN, s.refreshToken);
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<boolean> => {
    try {
      const deviceInfo = Device.modelName ?? "Unknown device";
      const res = await authApi.login({ ...payload, deviceInfo });
      await persistSession({
        uid: res.user.uid,
        role: res.user.role,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      return true;
    } catch (err) {
      console.error("[AuthProvider] login error:", err);
      return false;
    }
  }, [persistSession]);

  const socialLogin = useCallback(async (payload: Omit<SocialLoginPayload, "deviceInfo">): Promise<{ ok: boolean; message?: string }> => {
    try {
      const deviceInfo = Device.modelName ?? "Unknown device";
      // One retry on transport-level failures (no response reached us): the
      // exchange is idempotent server-side, and iOS-simulator sockets + flaky
      // mobile networks both benefit. Real 4xx/5xx responses are NOT retried.
      let res;
      try {
        res = await authApi.socialLogin({ ...payload, deviceInfo });
      } catch (firstErr) {
        const isTransport =
          typeof firstErr === "object" && firstErr !== null &&
          (firstErr as { isNetworkError?: boolean }).isNetworkError === true;
        if (!isTransport) throw firstErr;
        if (__DEV__) console.log("[AuthProvider] social exchange transport error — retrying once");
        await new Promise((r) => setTimeout(r, 700));
        res = await authApi.socialLogin({ ...payload, deviceInfo });
      }
      await persistSession({
        uid: res.user.uid,
        role: res.user.role,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      return { ok: true };
    } catch (err) {
      if (__DEV__) console.error("[AuthProvider] social login error:", err);
      // Surface the server's envelope message (e.g. the 409 "log in with your
      // password" guard) so the UI can show the real reason, not a generic one.
      const axiosMessage =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const message = axiosMessage || (err instanceof Error ? err.message : undefined);
      return { ok: false, message };
    }
  }, [persistSession]);

  const register = useCallback(async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const deviceInfo = Device.modelName ?? "Unknown device";
      const res = await authApi.register({ ...payload, deviceInfo });
      setPendingVerification(true);
      await persistSession({
        uid: res.user.uid,
        role: res.user.role,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      return true;
    } catch (err) {
      console.error("[AuthProvider] register error:", err);
      return false;
    }
  }, [persistSession]);

  const updateUser = useCallback(async (patch: Partial<AuthUser>) => {
    if (!session) return;
    await persistSession({ ...session, user: { ...session.user, ...patch } });
  }, [session, persistSession]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    await clearSecureStore(Object.values(SECURE_STORE_KEYS));
    setSession(null);
    setUser(null);
    setPendingVerification(false);
    Sentry.setUser(null);
    if (process.env.EXPO_PUBLIC_VEXO_API_KEY && !isRunningInExpoGo()) {
      identifyDevice(null).catch(() => {});
    }
    updateSession(null);
    router.replace("/(auth)/login");
  }, []);

  const value = useMemo(
    () => ({ initializing, session, user, login, register, socialLogin, signOut, setUser, updateUser }),
    [initializing, session, user, login, register, socialLogin, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
