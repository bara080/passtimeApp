require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Sentry = require("@sentry/node");
const { connectDB, setMongoReadyCallback } = require("./config/db");
const { connectRedis } = require("./config/redis");
// Firebase Admin is now lazy — see ./config/firebase.js — so cold starts
// don't pay the ~200ms initializeApp cost synchronously at module require.
const errorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./routes/authRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const hostRoutes = require("./routes/hostRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// ── Proxy trust — Vercel edge forwards X-Forwarded-For; without this,
// express-rate-limit throws on every request and req.ip is wrong.
app.set("trust proxy", 1);

// ── Global readiness flags ──────────────────────────────────────────────────
global.__DB_READY__ = false;
global.__REDIS_READY__ = false;
global.__APP_READY__ = false;

setMongoReadyCallback((ready) => {
  global.__DB_READY__ = ready;
  if (ready) console.log("✅ DB ready flag set");
  else console.warn("⚠️ DB ready flag cleared");
});

// ── Cold-start infra bootstrap ──────────────────────────────────────────────
// Mongo is required — the gate blocks on it. Redis is best-effort — it boots
// in parallel but never blocks a request. Auth middleware falls back to
// JWT-only trust when Redis isn't ready (see authMiddleware.js), so cold
// starts don't pay Redis's ~4s TCP+TLS handshake.
const mongoReadyPromise = (async () => {
  try {
    await connectDB();
    global.__APP_READY__ = true;
    console.log("🚀 Mongo ready (gate open)");
  } catch (err) {
    console.error("❌ Mongo bootstrap failed:", err.message);
  }
})();

// Redis fires-and-forgets. It flips __REDIS_READY__ when connected — no one
// awaits this promise on the request path.
connectRedis()
  .then(() => {
    global.__REDIS_READY__ = true;
    console.log("🚀 Redis ready (auth strict mode active)");
  })
  .catch((err) => {
    console.warn("⚠️ Redis bootstrap failed — running JWT-only:", err.message);
  });

const infraReadyPromise = mongoReadyPromise; // gate compat

// ── Stripe webhook (raw body — MUST be before express.json()) ───────────────
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // JSON API, no HTML

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // No origin header = same-origin, curl, or mobile app — always allow
      if (!origin) return callback(null, true);
      // In prod, an empty allowlist means "deny all cross-origin" (fail closed)
      const isProd = process.env.NODE_ENV === "production";
      if (allowedOrigins.length === 0) return callback(isProd ? new Error("CORS: no allowlist configured") : null, !isProd);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request timer ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  req._startedAt = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - req._startedAt;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
});

// ── Health check — MUST be above the readiness gate so monitoring probes
// (and Vercel keep-warm pings) can hit it without blocking on infra boot.
app.get("/api/health", (req, res) => {
  res.json({
    status: 0,
    message: "OK",
    data: {
      db: global.__DB_READY__,
      redis: global.__REDIS_READY__,
      ready: global.__APP_READY__,
    },
  });
});

// ── Warmup — hit by Vercel Cron every ~4 min. Actively touches Mongo + Redis
// so their pooled connections don't idle-close between real user requests
// (Mongo maxIdleTimeMS is 270s; without a periodic ping the pool empties and
// the next real request pays a fresh dial). Fire-and-forget: never fails the
// cron even if a subsystem is down.
app.get("/api/warmup", async (req, res) => {
  const started = Date.now();
  const touches = { mongo: false, redis: false };
  try {
    const { getConnection } = require("./config/db");
    const memberConn = getConnection("member");
    if (memberConn?.readyState === 1) {
      await memberConn.db.admin().ping();
      touches.mongo = true;
    }
  } catch (err) {
    console.warn("warmup mongo skip:", err.message);
  }
  try {
    const { getRedis, isRedisReady } = require("./config/redis");
    if (isRedisReady()) {
      await getRedis().ping();
      touches.redis = true;
    }
  } catch (err) {
    console.warn("warmup redis skip:", err.message);
  }
  res.json({
    status: 0,
    message: "warm",
    data: { touches, elapsedMs: Date.now() - started },
  });
});

// ── DB-ready gate (cold-start 503 guard) ────────────────────────────────────
const BOOT_TIMEOUT_MS = 12000;

app.use(async (req, res, next) => {
  if (global.__APP_READY__) return next();

  const start = Date.now();
  while (Date.now() - start < BOOT_TIMEOUT_MS) {
    if (global.__APP_READY__) return next();
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!global.__APP_READY__) {
    try {
      await infraReadyPromise;
    } catch {}
  }

  if (global.__APP_READY__) return next();

  res.setHeader("Retry-After", "5");
  return res.status(503).json({
    status: 1,
    message: "Service starting up — please retry in a few seconds.",
    data: { code: "STARTING_UP" },
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chats", chatRoutes);

// ── Sentry error handler ─────────────────────────────────────────────────────
Sentry.setupExpressErrorHandler(app);

// ── Central error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down...");
  const { disconnectRedis } = require("./config/redis");
  await disconnectRedis().catch(() => {});
  process.exit(0);
});

module.exports = app;
