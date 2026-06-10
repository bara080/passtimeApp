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
import * as Device from "expo-device";
import {
  saveToSecureStore,
  getFromSecureStore,
  clearSecureStore,
  SECURE_STORE_KEYS,
} from "@/utils/secureStore";
import { updateSession, type AuthSession } from "@/utils/sessionManager";
import { authApi } from "@/services/auth";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/services/auth/types";

type AuthContextType = {
  initializing: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  initializing: true,
  session: null,
  user: null,
  login: async () => false,
  register: async () => false,
  signOut: async () => {},
  setUser: () => {},
});

export function SessionProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
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
    } else if (session && !inAppGroup) {
      console.log("[AuthProvider] session found → redirecting to /(app)");
      router.replace("/(app)");
    } else {
      console.log("[AuthProvider] no redirect needed, staying on segment:", segments[0]);
    }
  }, [session, segments, initializing]);

  const persistSession = useCallback(async (s: AuthSession) => {
    setSession(s);
    setUser(s.user);
    updateSession(s);
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

  const register = useCallback(async (payload: RegisterPayload): Promise<boolean> => {
    try {
      const deviceInfo = Device.modelName ?? "Unknown device";
      const res = await authApi.register({ ...payload, deviceInfo });
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

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    await clearSecureStore(Object.values(SECURE_STORE_KEYS));
    setSession(null);
    setUser(null);
    updateSession(null);
    router.replace("/(auth)/login");
  }, []);

  const value = useMemo(
    () => ({ initializing, session, user, login, register, signOut, setUser }),
    [initializing, session, user, login, register, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
