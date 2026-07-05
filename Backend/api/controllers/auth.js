require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const admin = require("../config/firebase");
const { getUserModel, getConnection } = require("../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshExpiryDate,
} = require("../utils/jwt");
const { createSession, deleteSession, deleteAllUserSessions } = require("../utils/redisSession");
const { getRedis } = require("../config/redis");
const { success, created, error } = require("../utils/responseFormatter");
const AppError = require("../utils/AppError");
const { isValidEmail, validatePassword, validateName, validateDateOfBirth } = require("../utils/validators");
const { sendEmail, sendTemplate } = require("../config/resend");
const { renderTemplate } = require("../emails");

const RESET_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_TTL_SECONDS = 15 * 60;     // 15 minutes
const MAX_RESET_ATTEMPTS = 5;

// ── Register ─────────────────────────────────────────────────────────────────
exports.registerUser = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, deviceInfo } = req.body;

    if (!email || !password || !role) {
      return error(res, 400, "email, password, and role are required.");
    }
    if (!["member", "host"].includes(role)) {
      return error(res, 400, "role must be 'member' or 'host'.");
    }
    if (!isValidEmail(email)) {
      return error(res, 400, "Please provide a valid email address.");
    }
    const passwordError = validatePassword(password);
    if (passwordError) return error(res, 400, passwordError);

    const UserModel = getUserModel(role);
    const existingByEmail = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existingByEmail) return error(res, 409, "Email already registered.");

    // Create Firebase user (best-effort — MongoDB is the auth source of truth)
    let uid = uuidv4();
    try {
      const firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase().trim(),
        password,
        displayName: firstName ? `${firstName} ${lastName || ""}`.trim() : undefined,
      });
      uid = firebaseUser.uid;
    } catch (fbErr) {
      if (fbErr.code === "auth/email-already-exists") {
        return error(res, 409, "Email already registered.");
      }
      // Firebase not fully configured — continue with a generated uid
      console.warn("[register] Firebase user creation skipped:", fbErr.message);
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await UserModel.create({
      uid,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      role,
      firstName: firstName || "",
      lastName: lastName || "",
      displayName: firstName ? `${firstName} ${lastName || ""}`.trim() : "",
      emailVerified: false,
    });

    const sessionId = uuidv4();
    await createSession({ sessionId, uid, role, deviceInfo });

    const accessToken = generateAccessToken({ uid, role, sessionId });
    const refreshToken = generateRefreshToken({ uid, role, sessionId });

    const RefreshModel = getUserModel(role).db.model("RefreshToken");
    await RefreshModel.create({
      uid,
      token: refreshToken,
      expiresAt: getRefreshExpiryDate(),
      deviceInfo: deviceInfo || "Unknown",
    });

    return created(res, "Registration successful.", {
      accessToken,
      refreshToken,
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role, deviceInfo } = req.body;

    if (!email || !password || !role) {
      return error(res, 400, "email, password, and role are required.");
    }
    if (!["member", "host"].includes(role)) {
      return error(res, 400, "Invalid role.");
    }

    const UserModel = getUserModel(role);
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return error(res, 401, "Invalid email or password.");
    if (!user.isActive) return error(res, 403, "Account is deactivated.");

    if (user.isSocialLogin || !user.password) {
      return error(res, 400, "Please use social login for this account.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 401, "Invalid email or password.");

    const sessionId = uuidv4();
    await createSession({ sessionId, uid: user.uid, role, deviceInfo });

    const accessToken = generateAccessToken({ uid: user.uid, role, sessionId });
    const refreshToken = generateRefreshToken({ uid: user.uid, role, sessionId });

    const RefreshModel = user.db.model("RefreshToken");
    await RefreshModel.create({
      uid: user.uid,
      token: refreshToken,
      expiresAt: getRefreshExpiryDate(),
      deviceInfo: deviceInfo || "Unknown",
    });

    return success(res, "Login successful.", {
      accessToken,
      refreshToken,
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logoutUser = async (req, res, next) => {
  try {
    await deleteSession({ uid: req.user.uid, sessionId: req.sessionId });

    const RefreshModel = req.user.db.model("RefreshToken");
    await RefreshModel.updateMany({ uid: req.user.uid, revoked: false }, { revoked: true });

    return success(res, "Logged out successfully.", {});
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rt } = req.body;
    if (!rt) return error(res, 400, "refreshToken is required.");

    let decoded;
    try {
      decoded = verifyRefreshToken(rt);
    } catch {
      return error(res, 401, "Invalid or expired refresh token.");
    }

    const { uid, role, sessionId } = decoded;
    if (!["member", "host"].includes(role)) return error(res, 401, "Invalid role in token.");

    const UserModel = getUserModel(role);
    const RefreshModel = UserModel.db.model("RefreshToken");

    const storedToken = await RefreshModel.findOne({ uid, token: rt, revoked: false });
    if (!storedToken) return error(res, 401, "Refresh token revoked or not found.");

    if (new Date() > storedToken.expiresAt) {
      return error(res, 401, "Refresh token expired.");
    }

    const newSessionId = uuidv4();
    await createSession({ sessionId: newSessionId, uid, role });

    const newAccessToken = generateAccessToken({ uid, role, sessionId: newSessionId });
    const newRefreshToken = generateRefreshToken({ uid, role, sessionId: newSessionId });

    await storedToken.deleteOne();
    await RefreshModel.create({
      uid,
      token: newRefreshToken,
      expiresAt: getRefreshExpiryDate(),
    });

    return success(res, "Token refreshed.", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 400, "Email is required.");

    const normalized = email.toLowerCase().trim();

    // Find user across both clusters
    let foundUser = null, foundRole = null;
    for (const role of ["member", "host"]) {
      const user = await getUserModel(role).findOne({ email: normalized });
      if (user) { foundUser = user; foundRole = role; break; }
    }

    // Always return success to avoid email enumeration
    if (!foundUser) {
      return success(res, "If an account exists, a reset code has been sent.", {});
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + RESET_OTP_EXPIRY_MS);

    const PasswordReset = getConnection(foundRole).model("PasswordReset");
    await PasswordReset.findOneAndUpdate(
      { email: normalized },
      { uid: foundUser.uid, code, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    const devMode = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_...");

    if (devMode) {
      console.log(`[forgotPassword] DEV — reset code for ${normalized}: ${code}`);
    } else {
      try {
        const templateId = process.env.RESEND_PASSWORD_RESET_TEMPLATE_ID;
        const subject = "Reset your Passtime password";
        const variables = { name: foundUser.firstName || "there", code };
        const idempotencyKey = `reset/${foundUser.uid}/${expiresAt.toISOString()}`;
        if (templateId) {
          await sendTemplate({ to: normalized, subject, templateId, variables, idempotencyKey });
        } else {
          await sendEmail({
            to: normalized,
            subject,
            html: renderTemplate("password-reset", variables),
            idempotencyKey,
          });
        }
      } catch (emailErr) {
        console.error("[forgotPassword] Email send failed:", emailErr.message);
        // Don't surface email errors to the client — fall through
      }
    }

    return success(res, "If an account exists, a reset code has been sent.", {});
  } catch (err) {
    next(err);
  }
};

// ── Verify Reset Code ─────────────────────────────────────────────────────────
exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return error(res, 400, "email and code are required.");

    const normalized = email.toLowerCase().trim();

    let entry = null, entryRole = null;
    for (const role of ["member", "host"]) {
      const PasswordReset = getConnection(role).model("PasswordReset");
      const found = await PasswordReset.findOne({ email: normalized });
      if (found) { entry = found; entryRole = role; break; }
    }

    if (!entry) return error(res, 400, "No reset request found. Please request a new code.");
    if (entry.expiresAt < new Date()) return error(res, 422, "Reset code expired. Please request a new one.");
    if (entry.attempts >= MAX_RESET_ATTEMPTS) {
      return error(res, 422, "Too many attempts. Please request a new reset code.");
    }

    if (entry.code !== String(code).trim()) {
      const PasswordReset = getConnection(entryRole).model("PasswordReset");
      await PasswordReset.updateOne({ email: normalized }, { $inc: { attempts: 1 } });
      return error(res, 400, "Incorrect reset code.");
    }

    const { uid } = entry;

    // Issue a short-lived reset token in Redis — resets without this are rejected
    const redis = getRedis();
    await redis.set(`password-reset:${uid}`, "1", { EX: RESET_TOKEN_TTL_SECONDS });

    // Remove the OTP record
    const PasswordReset = getConnection(entryRole).model("PasswordReset");
    await PasswordReset.deleteOne({ email: normalized });

    return success(res, "Code verified.", { uid });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { uid, newPassword } = req.body;
    if (!uid || !newPassword) return error(res, 400, "uid and newPassword are required.");
    if (newPassword.length < 8) return error(res, 400, "Password must be at least 8 characters.");

    // Require that verifyResetCode was called recently
    const redis = getRedis();
    const allowed = await redis.get(`password-reset:${uid}`);
    if (!allowed) {
      return error(res, 403, "No active password reset for this account. Please start the reset flow again.");
    }
    await redis.del(`password-reset:${uid}`);

    const passwordHash = await bcrypt.hash(newPassword, 12);

    for (const role of ["member", "host"]) {
      await getUserModel(role).updateOne({ uid }, { password: passwordHash });
    }

    try {
      await admin.auth().updateUser(uid, { password: newPassword });
    } catch (fbErr) {
      console.error("[resetPassword] Firebase sync failed:", fbErr.message);
      // Don't block the reset — MongoDB is source of truth for our login
    }

    await deleteAllUserSessions(uid);

    return success(res, "Password reset successfully.", {});
  } catch (err) {
    next(err);
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return success(res, "OK", {
      uid: user.uid,
      email: user.email,
      role: req.userRole,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update Me ─────────────────────────────────────────────────────────────────
exports.updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth } = req.body;
    const updates = {};

    if (firstName !== undefined) {
      const err1 = validateName(firstName, "firstName");
      if (err1) return error(res, 400, err1);
      updates.firstName = String(firstName).trim();
    }
    if (lastName !== undefined) {
      const err2 = validateName(lastName, "lastName");
      if (err2) return error(res, 400, err2);
      updates.lastName = String(lastName).trim();
    }
    if (dateOfBirth !== undefined) {
      const { error: dobError, date } = validateDateOfBirth(dateOfBirth);
      if (dobError) return error(res, 400, dobError);
      updates.dateOfBirth = date;
    }
    if (Object.keys(updates).length === 0) {
      return error(res, 400, "Nothing to update. Allowed fields: firstName, lastName, dateOfBirth.");
    }
    if (updates.firstName || updates.lastName) {
      const first = updates.firstName ?? req.user.firstName ?? "";
      const last = updates.lastName ?? req.user.lastName ?? "";
      updates.displayName = `${first} ${last}`.trim();
    }

    const UserModel = getUserModel(req.userRole);
    const user = await UserModel.findOneAndUpdate({ uid: req.user.uid }, updates, { new: true });
    if (!user) return error(res, 404, "User not found.");

    return success(res, "Profile updated.", {
      uid: user.uid,
      email: user.email,
      role: req.userRole,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
    });
  } catch (err) {
    next(err);
  }
};
