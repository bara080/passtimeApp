import * as Sentry from "@sentry/react-native";
import { customEvent } from "vexo-analytics";
import LogRocket from "@logrocket/react-native";
import { isRunningInExpoGo } from "expo";

type EventProps = Record<string, string | number | boolean>;

/**
 * Single funnel-event fan-out: Sentry breadcrumb (context on crashes),
 * Vexo custom event (product analytics), LogRocket track (session replay).
 * Never throws — a tracker outage must not break a user flow.
 */
export function trackEvent(name: string, props: EventProps = {}): void {
  try {
    Sentry.addBreadcrumb({ category: "funnel", message: name, data: props, level: "info" });
  } catch {}
  if (isRunningInExpoGo()) return;
  try {
    customEvent(name, props);
  } catch {}
  try {
    LogRocket.track(name, props);
  } catch {}
}

/** Error-path companion: breadcrumb + Sentry capture with funnel tag. */
export function trackError(name: string, err: unknown, props: EventProps = {}): void {
  try {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { funnel: name },
      extra: props,
    });
  } catch {}
  trackEvent(`${name}.error`, { ...props, message: err instanceof Error ? err.message : String(err) });
}
