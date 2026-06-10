const rateLimit = require("express-rate-limit");

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
