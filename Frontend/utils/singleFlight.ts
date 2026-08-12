// Single-flight — dedupes concurrent calls to the same key.
//
// If a call for key `k` is in flight, a second `withSingleFlight(k, fn)`
// returns the SAME promise instead of firing `fn` again. Complements the
// server-side Idempotency-Key middleware by stopping bursts at the source.
//
// Use it for user-triggered actions where a double-tap or re-render can
// re-invoke: logout, login, register, pay, createBooking, createChat,
// sendMessage, savePushToken. See logout-idempotency.md.
//
// Scope: in-memory, per JS runtime. Not persisted. A cold start clears it,
// which is fine — server-side keys still dedupe across restarts.

const inflight = new Map<string, Promise<unknown>>();

/**
 * Run `fn` under key `k`. Concurrent callers with the same key share one
 * execution and receive the same resolved/rejected value. The map entry is
 * cleared when the underlying promise settles.
 */
export function withSingleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = (async () => {
    try {
      return await fn();
    } finally {
      // Small delay would smooth chatty callers, but a tick keeps semantics
      // simple: a fresh press after this resolves gets a new call.
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** True if a call is currently in flight under this key. Useful for UI state. */
export function isInFlight(key: string): boolean {
  return inflight.has(key);
}
