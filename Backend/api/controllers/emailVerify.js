require("dotenv").config();
const crypto = require("crypto");
const { success, error } = require("../utils/responseFormatter");
const { getUserModel, getConnection } = require("../config/db");
const { sendEmail, sendTemplate } = require("../config/resend");
const { renderTemplate } = require("../emails");

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

// ── Internal: find role cluster containing this email ─────────────────────────
async function findRoleByEmail(email) {
  for (const role of ["member", "host"]) {
    const UserModel = getUserModel(role);
    const user = await UserModel.findOne({ email });
    if (user) return { user, role };
  }
  return null;
}

// ── Internal: deliver verification email ──────────────────────────────────────
async function deliverVerificationEmail({ email, displayName, role }) {
  const conn = getConnection(role);
  const Verification = conn.model("Verification");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await Verification.findOneAndUpdate(
    { email },
    { code, token, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  const templateId = process.env.RESEND_EMAIL_VERIFY_TEMPLATE_ID;
  const idempotencyKey = `verify-email/${token}`;

  if (templateId) {
    await sendTemplate({
      to: email,
      subject: "Verify your email — Passtime",
      templateId,
      variables: { name: displayName || email, code },
      idempotencyKey,
    });
  } else {
    await sendEmail({
      to: email,
      subject: "Verify your email — Passtime",
      html: renderTemplate("email-verification", { name: displayName || "there", code }),
      idempotencyKey,
    });
  }

  return { code, token };
}

// ── Send Email OTP ─────────────────────────────────────────────────────────────
exports.sendVerificationEmail = async (req, res, next) => {
  try {
    const { email, displayName } = req.body;
    if (!email) return error(res, 400, "email is required.");

    const result = await findRoleByEmail(email.toLowerCase().trim());
    if (result) {
      try {
        await deliverVerificationEmail({
          email: email.toLowerCase().trim(),
          displayName: displayName || result.user.displayName,
          role: result.role,
        });
      } catch (emailErr) {
        console.error("[send-verify-email] delivery failed:", emailErr.message);
      }
    }
    // Always the same response — do not leak whether an account exists (enumeration).
    return success(res, "If an account exists, a verification code has been sent.");
  } catch (err) {
    next(err);
  }
};

// ── Verify Email OTP ───────────────────────────────────────────────────────────
exports.verifyEmailCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return error(res, 400, "email and code are required.");

    const result = await findRoleByEmail(email.toLowerCase().trim());
    if (!result) return error(res, 404, "No account found for this email.");

    const { user, role } = result;
    const conn = getConnection(role);
    const Verification = conn.model("Verification");

    const entry = await Verification.findOne({ email: email.toLowerCase().trim() });
    if (!entry) return error(res, 400, "No verification request found. Please resend the code.");
    if (entry.expiresAt < new Date()) return error(res, 422, "Verification code expired. Please request a new one.");
    if (entry.attempts >= MAX_ATTEMPTS) return error(res, 422, "Too many attempts. Please request a new code.");

    if (entry.code !== String(code).trim()) {
      await Verification.updateOne({ email }, { $inc: { attempts: 1 } });
      return error(res, 400, "Incorrect verification code.");
    }

    // Mark verified in both clusters (same uid may exist in both)
    const UserModel = getUserModel(role);
    await UserModel.updateOne({ email: email.toLowerCase().trim() }, { emailVerified: true });
    await Verification.deleteOne({ email });

    // Send welcome email
    const templateId = process.env.RESEND_WELCOME_TEMPLATE_ID;
    const idempotencyKey = `welcome/${encodeURIComponent(email)}`;
    if (templateId) {
      await sendTemplate({
        to: email,
        subject: `Welcome to Passtime, ${user.firstName || "there"}!`,
        templateId,
        variables: { name: user.firstName || "there" },
        idempotencyKey,
      });
    } else {
      await sendEmail({
        to: email,
        subject: `Welcome to Passtime!`,
        html: renderTemplate("welcome", { name: user.firstName || "there" }),
        idempotencyKey,
      });
    }

    return success(res, "Email verified successfully.", { verified: true });
  } catch (err) {
    next(err);
  }
};

// ── Verify Email Token (link-based) ───────────────────────────────────────────
exports.verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return error(res, 400, "token is required.");

    for (const role of ["member", "host"]) {
      const conn = getConnection(role);
      const Verification = conn.model("Verification");
      const entry = await Verification.findOne({ token });
      if (!entry) continue;

      if (entry.expiresAt < new Date()) {
        return error(res, 422, "Verification link expired. Please request a new one.");
      }

      const UserModel = getUserModel(role);
      await UserModel.updateOne({ email: entry.email }, { emailVerified: true });
      await Verification.deleteOne({ token });

      return success(res, "Email verified successfully.", { verified: true });
    }

    return error(res, 404, "Verification link not found.");
  } catch (err) {
    next(err);
  }
};
