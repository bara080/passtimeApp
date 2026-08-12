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
const favoritesRoutes = require("./routes/favoritesRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const identityRoutes = require("./routes/identityRoutes");

const app = express();

// ── Proxy trust — Vercel edge forwards X-Forwarded-For; without this,
// express-rate-limit throws on every request and req.ip is wrong.
app.set("trust proxy", 1);

// ── Global readiness flags ──────────────────────────────────────────────────
global.__DB_READY__ = false;
global.__REDIS_READY__ = false;
global.__APP_READY__ = false;

// Mirror __APP_READY__ ← __DB_READY__ so a disconnect re-closes the gate.
// Old code left __APP_READY__ true forever → hung requests on idle drop.
setMongoReadyCallback((ready) => {
  global.__DB_READY__ = ready;
  global.__APP_READY__ = ready; // was: only ever set true in mongoReadyPromise below
  if (ready) console.log("✅ DB ready flag set (gate open)");
  else console.warn("⚠️ DB ready flag cleared (gate closed)");
});

// ── Cold-start infra bootstrap ──────────────────────────────────────────────
// Mongo is required — the gate blocks on it. Redis is best-effort — it boots
// in parallel but never blocks a request. Auth middleware falls back to
// JWT-only trust when Redis isn't ready (see authMiddleware.js), so cold
// starts don't pay Redis's ~4s TCP+TLS handshake.
const mongoReadyPromise = (async () => {
  try {
    await connectDB();
    // global.__APP_READY__ = true; // old: superseded by setMongoReadyCallback above
    console.log("🚀 Mongo bootstrap resolved");
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

// ── Warmup — Vercel Cron every 5 min. Waits ≤6s for bootstrap, re-dials
// dead pools, then pings. Old fire-and-forget version returned early on
// cold containers so the pool never got warmed for that Lambda.
app.get("/api/warmup", async (req, res) => {
  const started = Date.now();
  const touches = { mongo: false, redis: false };
  const notes = [];

  // Wait ≤6s for async bootstrap (cron path, so a slow response is ok).
  const deadline = started + 6000;
  while (!global.__APP_READY__ && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
  }

  const { connectDB, getConnection } = require("./config/db");
  const { connectRedis, getRedis, isRedisReady } = require("./config/redis");

  // Gate still closed after wait → active re-dial. Observed: Atlas idle
  // drops leave a Lambda dead until the next request pokes it. connectDB
  // is idempotent (fast-returns if both conns readyState=1).
  if (!global.__APP_READY__) {
    try {
      await connectDB();
      notes.push("mongo re-dial ok");
    } catch (err) {
      notes.push(`mongo re-dial failed: ${err.message}`);
    }
  }
  if (!isRedisReady()) {
    try {
      await connectRedis();
      notes.push("redis re-dial ok");
    } catch (err) {
      notes.push(`redis re-dial failed: ${err.message}`);
    }
  }

  try {
    const memberConn = getConnection("member");
    if (memberConn?.readyState === 1) {
      await memberConn.db.admin().ping();
      touches.mongo = true;
    } else {
      notes.push(`mongo not ready (state=${memberConn?.readyState})`);
    }
  } catch (err) {
    // old: console.warn("warmup mongo skip:", err.message);
    notes.push(`mongo skip: ${err.message}`);
  }

  try {
    if (isRedisReady()) {
      await getRedis().ping();
      touches.redis = true;
    } else {
      notes.push("redis not ready");
    }
  } catch (err) {
    // old: console.warn("warmup redis skip:", err.message);
    notes.push(`redis skip: ${err.message}`);
  }

  res.json({
    status: 0,
    message: "warm",
    data: { touches, elapsedMs: Date.now() - started, notes },
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
app.use("/api/favorites", favoritesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/identity", identityRoutes);

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
