require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { success, error } = require("../utils/responseFormatter");
const { getUserModel } = require("../config/db");
const { getSession } = require("../utils/redisSession");
const { normalizePhone } = require("../utils/normalizePhone");
const { telnyxClient, verifyProfileId } = require("../config/telnyx");
const { getRedis, isRedisReady } = require("../config/redis");

const OTP_DIGITS = 5;

// SMS cost guard — the same phone number can only trigger a Telnyx send once
// per SEND_COOLDOWN_SECONDS. Rate limiter already caps 5/10min per IP; this
// covers the tighter "double-tap resend" case that a limiter's window misses.
// See /Users/bara080/bara/passtime/logout-idempotency.md P0#4.
// FOLLOW-UP: bump if UX shows a countdown longer than this.
const SEND_COOLDOWN_SECONDS = 60;

function generateCode() {
  const max = 10 ** OTP_DIGITS;
  return String(crypto.randomInt(0, max)).padStart(OTP_DIGITS, "0");
}

// ── Send OTP ───────────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return error(res, 400, "phoneNumber is required.");

    if (!telnyxClient) {
      return error(res, 500, "OTP provider not configured.", {
        requiredEnv: ["TELNYX_API_KEY", "TELNYX_VERIFY_PROFILE_ID"],
      });
    }

    const trimmed = String(phoneNumber).trim();

    // Cost cutoff — if we already sent to this number seconds ago, no-op.
    // Client sees the same success shape; Telnyx bill stays flat under bursts.
    // Redis-degraded fallback: we skip the check and let the rate limiter handle it.
    if (isRedisReady()) {
      const key = `otp:sent:${trimmed}`;
      try {
        const cached = await getRedis().get(key);
        if (cached) {
          const { requestId, telnyxStatus } = JSON.parse(cached);
          return success(res, "OTP already sent — please wait for it to arrive.", {
            requestId,
            telnyxStatus,
            replay: true,
          });
        }
      } catch (redisErr) {
        console.warn("[sendOtp] cache read failed:", redisErr.message);
      }
    }

    const createResp = await telnyxClient.verifications.triggerSMS({
      phone_number: trimmed,
      verify_profile_id: verifyProfileId,
      custom_code: generateCode(),
    });

    const data = createResp?.data;
    if (!data?.id || data.status === "error" || data.status === "invalid") {
      console.error("[phoneVerify] Telnyx send failed:", data);
      return error(res, 503, "Failed to send OTP. Please try again.", {
        telnyxStatus: data?.status,
      });
    }

    // Persist the "sent" state so a retry within cooldown replays instead of
    // firing another SMS. TTL == cooldown; expires naturally.
    if (isRedisReady()) {
      const key = `otp:sent:${trimmed}`;
      try {
        await getRedis().set(
          key,
          JSON.stringify({ requestId: data.id, telnyxStatus: data.status }),
          { EX: SEND_COOLDOWN_SECONDS }
        );
      } catch (redisErr) {
        console.warn("[sendOtp] cache write failed:", redisErr.message);
      }
    }

    return success(res, "OTP sent.", {
      requestId: data.id,
      telnyxStatus: data.status,
    });
  } catch (err) {
    next(err);
  }
};

// ── Verify OTP ─────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return error(res, 400, "phoneNumber and code are required.");
    }
    if (!new RegExp(`^\\d{${OTP_DIGITS}}$`).test(String(code).trim())) {
      return error(res, 400, `OTP must be ${OTP_DIGITS} digits.`);
    }

    if (!telnyxClient) {
      return error(res, 500, "OTP provider not configured.");
    }

    const trimmedPhone = String(phoneNumber).trim();
    const safeCode = String(code).trim();

    const verifyResp = await telnyxClient.verifications.byPhoneNumber.actions.verify(
      trimmedPhone,
      { code: safeCode, verify_profile_id: verifyProfileId }
    );

    if (verifyResp?.data?.response_code !== "accepted") {
      return error(res, 400, "Incorrect or expired OTP.", {
        telnyxResponseCode: verifyResp?.data?.response_code,
      });
    }

    // If the request carries a valid JWT session, persist phoneVerified on the user
    await persistVerifiedPhone(req, trimmedPhone);

    return success(res, "Phone verified successfully.", { verified: true });
  } catch (err) {
    next(err);
  }
};

// Persist phoneNumber + phoneVerified on the authenticated user after OTP approval
async function persistVerifiedPhone(req, rawPhone) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return;

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return;
  }

  const { uid, role, sessionId } = decoded;
  if (!uid || !sessionId) return;

  const session = await getSession(sessionId);
  if (!session || String(session.uid) !== String(uid)) return;

  if (!["member", "host"].includes(role)) return;

  const normalized = normalizePhone(rawPhone);
  if (!normalized) return;

  try {
    const UserModel = getUserModel(role);
    await UserModel.updateOne({ uid }, { phoneNumber: normalized, phoneVerified: true });
  } catch (err) {
    console.error("[phoneVerify] Failed to persist phoneVerified:", err.message);
  }
}
