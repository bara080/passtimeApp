// Idempotency-Key helper for the axios client.
//
// Backend contract (see /Users/bara080/bara/passtime/logout-idempotency.md):
//   • Selected POST routes accept an `Idempotency-Key` header.
//   • The server caches the 2xx response in Redis for ~60s keyed by
//     `<uid|ip>:<key>`; replays return the cached body with header
//     `Idempotent-Replay: true`.
//   • Stripe-facing routes (booking pay/cancel) forward their own key to
//     Stripe, which dedupes for 24h.
//
// This module only decides "does this request need a key" and mints one.
// The actual header injection is done by the axios interceptor in httpClient.

import * as ExpoCrypto from "expo-crypto";

/**
 * POST routes that MUST carry an Idempotency-Key.
 * Match is by path suffix (post-`/api`), method-aware (all here are POST).
 * Keep this in sync with backend middleware mounts.
 */
const IDEMPOTENT_POST_PATHS = new Set<string>([
  // P0 — money / data damage
  "/auth/register",
  "/auth/send-otp",
  "/bookings", // create
  // P1 — UX / cost
  "/auth/logout",
  "/notifications/push-token",
  "/media/upload-url", // metered signed-URL mint — dedupe retry bursts

  // P2 — cosmetic replay of 200 instead of state-machine 409
  // (server accepts these too; wiring is cheap)
]);

/**
 * POST routes whose path includes a resource id, matched by regex on the
 * post-`/api` suffix. Separate from the exact-match set so route params don't
 * pollute Set lookups.
 */
const IDEMPOTENT_POST_PATTERNS: RegExp[] = [
  /^\/bookings\/[^/]+\/(pay|cancel|accept|decline)$/,
  /^\/chats\/[^/]+\/message$/,
];

/** Strip baseURL + query, normalize trailing slash. Mirrors httpClient util. */
function normalizePath(url: string | undefined, baseURL: string): string {
  if (!url) return "";
  return String(url).replace(baseURL, "").split("?")[0].replace(/\/$/, "") || "/";
}

/** Does this method+path need an Idempotency-Key? */
export function needsIdempotencyKey(
  method: string | undefined,
  url: string | undefined,
  baseURL: string
): boolean {
  if ((method || "").toUpperCase() !== "POST") return false;
  const path = normalizePath(url, baseURL);
  if (IDEMPOTENT_POST_PATHS.has(path)) return true;
  return IDEMPOTENT_POST_PATTERNS.some((re) => re.test(path));
}

/**
 * Generate a fresh key. UUID v4 via expo-crypto — native, no dep bloat.
 * Format matches the server-side regex `[A-Za-z0-9_-]{8,64}`.
 */
export function newIdempotencyKey(): string {
  return ExpoCrypto.randomUUID();
}
