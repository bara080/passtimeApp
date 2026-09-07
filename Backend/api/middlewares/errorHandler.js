module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  const mongoUnavailable =
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoNetworkTimeoutError" ||
    err.name === "MongoNotConnectedError";

  if (mongoUnavailable) {
    global.__DB_READY__ = false;
    res.setHeader("Retry-After", "10");
    return res.status(503).json({
      status: 1,
      message: "Database temporarily unavailable — please retry",
      data: { code: "DB_UNAVAILABLE" },
    });
  }

  // Third-party (Stripe) SDK errors carry their OWN statusCode (e.g. 401 when the
  // Stripe key is invalid/misconfigured, 402 on a card decline). Passing that
  // through as our HTTP status makes the client misread an upstream/config failure
  // as the USER's auth failure — the app's 401 interceptor then refreshes/clears
  // tokens and logs the user out. Remap Stripe errors so their status can't leak:
  //   card decline -> 402, rate limit -> 429, everything else -> 502 Bad Gateway.
  const isStripeError = typeof err.type === "string" && err.type.startsWith("Stripe");
  // old: const status = err.status || err.statusCode || 500;
  let status;
  if (isStripeError) {
    if (err.type === "StripeCardError") status = 402;
    else if (err.type === "StripeRateLimitError") status = 429;
    else status = 502;
  } else {
    status = err.status || err.statusCode || 500;
  }
  const message = err.message || "Internal server error";

  return res.status(status).json({
    status: 1,
    message,
    data: err.data || null,
    ...(res.sentry ? { sentryEventId: res.sentry } : {}),
  });
};
