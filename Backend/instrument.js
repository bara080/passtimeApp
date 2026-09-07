// Load env BEFORE Sentry.init so SENTRY_DSN is defined.
// Bug fix: index.js did `require("./instrument")` on line 1 and
// `require("dotenv").config()` on line 2 — so Sentry.init previously ran with
// process.env.SENTRY_DSN === undefined and silently reported nothing.
// dotenv.config() is idempotent (won't override already-set vars), so calling
// it here as well is safe alongside the calls in index.js / api/app.js.
require("dotenv").config();

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  // old: integrations: [nodeProfilingIntegration()],
  integrations: [
    nodeProfilingIntegration(),
    // Forward console.warn / console.error to Sentry Logs so existing
    // console.* calls show up in the Logs view (add "log" to also capture info).
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
  // Enable the Logs product — required for both the console forwarding above
  // and structured logging via Sentry.logger.info/warn/error(...).
  enableLogs: true,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
});
