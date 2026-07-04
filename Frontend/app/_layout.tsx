import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { isRunningInExpoGo } from "expo";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import { vexo } from "vexo-analytics";
import LogRocket from "@logrocket/react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryProvider } from "@/components/queryproviders";
import { SessionProvider } from "@/context/AuthProvider";

Sentry.init({
  dsn:
    process.env.EXPO_PUBLIC_SENTRY_DSN ??
    "https://fc32fa7fe8edb60f24e91769f06d5f7b@o4510582988603392.ingest.us.sentry.io/4511675246051328",
  sendDefaultPii: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  profilesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.1,
  enableLogs: true,
  integrations: [Sentry.mobileReplayIntegration()],
  enableNativeFramesTracking: !isRunningInExpoGo(),
  environment: __DEV__ ? "development" : "production",
});

const VEXO_API_KEY = process.env.EXPO_PUBLIC_VEXO_API_KEY ?? "";
if (VEXO_API_KEY && !isRunningInExpoGo()) {
  vexo(VEXO_API_KEY);
}

const LOGROCKET_APP_ID = process.env.EXPO_PUBLIC_LOGROCKET_APP_ID ?? "";
if (LOGROCKET_APP_ID && !isRunningInExpoGo()) {
  LogRocket.init(LOGROCKET_APP_ID);
}

SplashScreen.preventAutoHideAsync();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function RootLayout() {
  useEffect(() => {
    console.log("[Splash] hiding splash screen");
    SplashScreen.hideAsync();
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.passtime.app">
      <QueryProvider>
        <SessionProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SessionProvider>
      </QueryProvider>
    </StripeProvider>
  );
}

export default Sentry.wrap(RootLayout);
