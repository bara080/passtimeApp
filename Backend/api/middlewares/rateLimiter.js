const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// 5 OTP sends per 10 minutes per IP
exports.otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many OTP requests. Try again in 10 minutes.", data: null },
});

// 10 OTP verify attempts per 10 minutes per IP
exports.otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many verification attempts. Try again later.", data: null },
});

// 5 forgot-password attempts per 15 minutes per IP
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many reset attempts. Try again in 15 minutes.", data: null },
});

// 5 login attempts per 15 minutes per IP+email (defense against credential stuffing)
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator normalizes IPv6 so subnet users can't rotate addresses to bypass the limit.
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").toLowerCase().trim()}`,
  message: { status: 1, message: "Too many login attempts. Try again in 15 minutes.", data: null },
});

// 3 registrations per hour per IP (defense against enumeration / mass account creation)
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many signup attempts. Try again later.", data: null },
});

// 5 reset-password submissions per hour per IP (prevents brute-forcing the reset token/uid)
exports.resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many password reset attempts. Try again later.", data: null },
});

// 20 upload-URL creations per hour per IP (cost-DoS mitigation on Firebase Storage)
exports.uploadUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many uploads. Try again later.", data: null },
});

// 30 messages per minute per IP+uid (chat.md — fixes Zinga GAP-13).
exports.sendMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.user?.uid || "anon"}`,
  message: { status: 1, message: "You are messaging too fast. Slow down.", data: null },
});

// 10 booking creations per hour per IP (prevents request-spam floods on hosts)
exports.createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 1, message: "Too many booking requests. Try again later.", data: null },
});
