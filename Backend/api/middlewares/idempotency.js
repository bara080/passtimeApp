// Idempotency middleware — replays a cached response when the client resends
// the same Idempotency-Key inside the TTL window. Optional per-route: routes
// that don't send the header are passed through unchanged.
//
// Cache key: `idem:<scope>:<uid|ip>:<key>`. Payload: `{status, body}` JSON.
//
// See /Users/bara080/bara/passtime/logout-idempotency.md for the audit.

const { getRedis, isRedisReady } = require("../config/redis");

// Header key format: uuid-ish. 8-64 chars, [A-Za-z0-9_-]. Stops accidental
// long/short payloads from being cached (also protects Redis key length).
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

// Short TTL — long enough to catch retry storms + double-taps, short enough
// that a stale replay never confuses a user coming back an hour later.
const DEFAULT_TTL_SECONDS = 60;

/**
 * Build an Express middleware that dedupes retries by Idempotency-Key.
 *
 * @param {object}  opts
 * @param {string}  opts.scope     Route-family label used in the Redis key
 *                                 (e.g. "booking-pay"). Keep stable — if it
 *                                 changes, in-flight cached replays are lost.
 * @param {number}  [opts.ttl=60]  Seconds to cache the response.
 * @param {boolean} [opts.required=false]  If true, missing header → 400.
 *                                 Enable AFTER frontend is sending the header
 *                                 or you'll break existing clients.
 * @returns {import("express").RequestHandler}
 */
function requireIdempotencyKey({ scope, ttl = DEFAULT_TTL_SECONDS, required = false } = {}) {
  if (!scope) throw new Error("idempotency middleware needs a scope");

  return async function idempotencyMw(req, res, next) {
    // Client-supplied replay id — case-insensitive header name per RFC 7230.
    const rawKey = req.headers["idempotency-key"];

    if (!rawKey) {
      if (required) {
        return res.status(400).json({
          status: 1,
          message: "Idempotency-Key header is required for this endpoint.",
          data: { code: "IDEMPOTENCY_KEY_REQUIRED" },
        });
      }
      return next();
    }

    const key = String(rawKey).trim();
    if (!KEY_RE.test(key)) {
      return res.status(400).json({
        status: 1,
        message: "Idempotency-Key must be 8-64 chars, alphanumeric plus _ or -.",
        data: { code: "IDEMPOTENCY_KEY_INVALID" },
      });
    }

    // Redis is best-effort. If it's down we pass through — the caller pays
    // for weakened guarantees but we don't take the API down with Redis.
    // FOLLOW-UP: if Redis outages get long, consider a bounded in-memory
    // fallback keyed the same way (per-lambda only, still helps in bursts).
    if (!isRedisReady()) return next();

    // Owner isolation — authed uid preferred (idempotency is per-user), fall
    // back to IP for pre-auth routes (register, forgot-password, send-otp).
    const owner = req.user?.uid || req.ip || "anon";
    const cacheKey = `idem:${scope}:${owner}:${key}`;
    const redis = getRedis();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const { status, body } = JSON.parse(cached);
        res.setHeader("Idempotent-Replay", "true");
        return res.status(status).json(body);
      }
    } catch (err) {
      console.warn("[idempotency] cache read failed:", err.message);
      return next();
    }

    // Wrap res.json so the handler's response body is what we cache. This is
    // the reason the middleware sits BEFORE the controller in the chain.
    // FOLLOW-UP: if a route ever uses res.send / res.end directly, wrap those
    // too — right now only res.json is intercepted.
    const origJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode || 200;
      // Only cache 2xx. 4xx/5xx are usually user-input or transient — a client
      // fixing its request should not get the stale error back.
      if (status >= 200 && status < 300) {
        redis
          .set(cacheKey, JSON.stringify({ status, body }), { EX: ttl })
          .catch((err) => console.warn("[idempotency] cache write failed:", err.message));
      }
      return origJson(body);
    };

    next();
  };
}

module.exports = { requireIdempotencyKey };
