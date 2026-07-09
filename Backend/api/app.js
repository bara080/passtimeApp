require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Sentry = require("@sentry/node");
const { connectDB, setMongoReadyCallback } = require("./config/db");
const { connectRedis } = require("./config/redis");
require("./config/firebase"); // initialize firebase admin
const errorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./routes/authRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const hostRoutes = require("./routes/hostRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

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
const infraReadyPromise = (async () => {
  try {
    await Promise.all([connectDB(), connectRedis()]);
    global.__REDIS_READY__ = true;
    global.__APP_READY__ = true;
    console.log("🚀 Infra ready");
  } catch (err) {
    console.error("❌ Infra bootstrap failed:", err.message);
  }
})();

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

// ── Health check ────────────────────────────────────────────────────────────
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
