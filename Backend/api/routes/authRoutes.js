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
  deleteMe,
  socialLogin,
} = require("../controllers/auth");
const { sendOtp, verifyOtp } = require("../controllers/phoneVerify");
const { sendVerificationEmail, verifyEmailCode, verifyEmailToken } = require("../controllers/emailVerify");
const verifyJWT = require("../middlewares/authMiddleware");
// Soft verifier for /logout — accepts a valid JWT whose Redis session was
// already torn down by a prior successful logout. See logout-idempotency.md.
const { buildVerifier } = require("../middlewares/authMiddleware");
const verifyJWTForLogout = buildVerifier({ allowMissingSession: true });
const { otpSendLimiter, otpVerifyLimiter, forgotPasswordLimiter, loginLimiter, registerLimiter, resetPasswordLimiter } = require("../middlewares/rateLimiter");

// Public
router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/social", socialLogin);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/verify-reset-code", otpVerifyLimiter, verifyResetCode);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

// OTP — phone
router.post("/send-otp", otpSendLimiter, sendOtp);
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);

// OTP — email
router.post("/send-verify-email", otpSendLimiter, sendVerificationEmail);
router.post("/verify-email-code", otpVerifyLimiter, verifyEmailCode);
router.get("/verify-email-token", verifyEmailToken);

// Protected
// old: router.post("/logout", verifyJWT, logoutUser);
router.post("/logout", verifyJWTForLogout, logoutUser);
router.get("/me", verifyJWT, getMe);
router.patch("/me", verifyJWT, updateMe);
router.delete("/me", verifyJWT, deleteMe);

module.exports = router;
