const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getMe,
  updateMe,
  socialLogin,
} = require("../controllers/auth");
const { sendOtp, verifyOtp } = require("../controllers/phoneVerify");
const { sendVerificationEmail, verifyEmailCode, verifyEmailToken } = require("../controllers/emailVerify");
const verifyJWT = require("../middlewares/authMiddleware");
const { otpSendLimiter, otpVerifyLimiter, forgotPasswordLimiter } = require("../middlewares/rateLimiter");

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social", socialLogin);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-reset-code", otpVerifyLimiter, verifyResetCode);
router.post("/reset-password", resetPassword);

// OTP — phone
router.post("/send-otp", otpSendLimiter, sendOtp);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);

// OTP — email
router.post("/send-verify-email", otpSendLimiter, sendVerificationEmail);
router.post("/verify-email-code", otpVerifyLimiter, verifyEmailCode);
router.get("/verify-email-token", verifyEmailToken);

// Protected
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getMe);
router.patch("/me", verifyJWT, updateMe);

module.exports = router;
