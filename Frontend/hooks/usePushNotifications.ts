import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import { notificationsApi } from "@/services/notifications";
import { trackError } from "@/utils/analytics";

/** Foreground behavior — always banner + sound + list.
 *  Self-notifications are suppressed by the BACKEND (actorUid check in
 *  notifyUser), so nothing extra is needed here. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#ff6633",
  });
}

async function registerAndSave(uidRef: React.MutableRefObject<string | null>): Promise<void> {
  if (isRunningInExpoGo()) return; // Expo Go can't get real push tokens on SDK 53+
  if (!Device.isDevice) return; // Simulators don't receive real push
  if (!uidRef.current) return;

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return;

  const projectId =
    (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } })?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = tokenResponse.data;
  if (!token) return;

  await notificationsApi.savePushToken({
    token,
    platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : undefined,
  });
}

/**
 * Registers the device for push and holds a listener that fires when the user
 * taps a notification. The onDeepLink callback receives `notification.data`
 * (which the backend seeds with `{ type, bookingId, chatId, … }`).
 */
export function usePushNotifications(uid: string | null | undefined, onDeepLink: (data: Record<string, unknown>) => void) {
  const uidRef = useRef<string | null>(uid ?? null);
  useEffect(() => {
    uidRef.current = uid ?? null;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    ensureAndroidChannels().catch(() => {});
    registerAndSave(uidRef).catch((err) => trackError("push.register", err));

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data || {};
        onDeepLink(data as Record<string, unknown>);
      } catch (err) {
        trackError("push.deeplink", err);
      }
    });

    return () => {
      responseSub.remove();
    };
  }, [uid, onDeepLink]);
}
