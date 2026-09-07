// Secure test-OTP hook — lets automated/E2E tests verify designated TEST accounts
// without a real inbox/SMS, WITHOUT weakening real auth. Modeled on Firebase Auth
// "test phone numbers" and Twilio test credentials.
//
// Security model (defense in depth — ALL must hold for a bypass to apply):
//   1. NODE_ENV must NOT be "production".
//   2. TEST_OTP_ENABLED must be exactly "true" (explicit opt-in; absent = disabled).
//   3. TEST_OTP_CODE must be set AND match the submitted code exactly.
//   4. The identifier (email/phone) must be on the TEST_OTP_EMAILS / TEST_OTP_PHONES
//      allow-list — so this is never a blanket backdoor for arbitrary accounts.
//
// It also fails CLOSED: assertTestOtpSafeForProd() aborts boot if these are ever
// enabled under NODE_ENV=production, so a misconfigured deploy can't silently ship
// a bypass. None of these env vars exist in production, so the hook is inert there.

function normalize(v) {
  return String(v || "").trim().toLowerCase();
}

function allowlist(varName) {
  return (process.env[varName] || "")
    .split(",")
    .map((s) => normalize(s))
    .filter(Boolean);
}

/**
 * @param {string} identifier  email or phone number being verified
 * @param {string} code        the code the client submitted
 * @param {"email"|"phone"} kind
 * @returns {boolean} true only if every guard passes and the account is an allow-listed test account
 */
function testOtpAllowed(identifier, code, kind) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.TEST_OTP_ENABLED !== "true") return false;

  // Per-kind code (email codes are 6 digits, phone 5) with a shared fallback.
  const expected =
    process.env[kind === "email" ? "TEST_OTP_CODE_EMAIL" : "TEST_OTP_CODE_PHONE"] ||
    process.env.TEST_OTP_CODE;
  if (!expected || String(code).trim() !== String(expected).trim()) return false;

  const list = allowlist(kind === "email" ? "TEST_OTP_EMAILS" : "TEST_OTP_PHONES");
  return list.includes(normalize(identifier));
}

/** True if the identifier is an allow-listed test account and the hook is enabled
 *  (used by send-OTP paths to skip the real Telnyx/Resend send — no code check). */
function isTestOtpAccount(identifier, kind) {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.TEST_OTP_ENABLED !== "true") return false;
  const list = allowlist(kind === "email" ? "TEST_OTP_EMAILS" : "TEST_OTP_PHONES");
  return list.includes(normalize(identifier));
}

/** Fail-closed boot guard: refuse to start if the test hook is enabled in production. */
function assertTestOtpSafeForProd() {
  if (process.env.NODE_ENV === "production" && process.env.TEST_OTP_ENABLED === "true") {
    // eslint-disable-next-line no-console
    console.error(
      "[FATAL] TEST_OTP_ENABLED=true under NODE_ENV=production. Refusing to start — " +
        "the test-OTP hook must never be enabled in production."
    );
    process.exit(1);
  }
}

module.exports = { testOtpAllowed, isTestOtpAccount, assertTestOtpSafeForProd };
