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

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(status).json({
    status: 1,
    message,
    data: err.data || null,
    ...(res.sentry ? { sentryEventId: res.sentry } : {}),
  });
};
