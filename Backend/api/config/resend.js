const { Resend } = require("resend");

// Lazy init — a missing key must fail the email feature, not crash the whole API at boot
let resendClient = null;
function getResend() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set — email sending is unavailable");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getFrom() {
  const email = process.env.EMAIL_FROM;
  if (!email) throw new Error("EMAIL_FROM env var is required");
  const name = process.env.EMAIL_FROM_NAME || "Passtime";
  return `${name} <${email}>`;
}

function normalizeVars(input) {
  if (input == null) return undefined;
  if (input instanceof Date) return input.toISOString();
  const t = typeof input;
  if (t === "string") return input;
  if (t === "number" || t === "boolean") return String(input);
  if (Array.isArray(input)) return input.map(normalizeVars).filter((v) => v !== undefined);
  if (t === "object") {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      const n = normalizeVars(v);
      if (n !== undefined) out[k] = n;
    }
    return out;
  }
  return undefined;
}

exports.sendEmail = async ({ to, subject, html, text, idempotencyKey }) => {
  const payload = {
    from: getFrom(),
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    const err = new Error(error.message || "Resend send failed");
    err.name = error.name || "ResendError";
    throw err;
  }
  return data;
};

exports.sendTemplate = async ({ to, subject, templateId, variables, idempotencyKey }) => {
  if (!templateId) throw new Error("templateId is required");
  const payload = {
    from: getFrom(),
    to,
    subject,
    template: { id: templateId, variables: normalizeVars(variables) || {} },
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    const err = new Error(error.message || "Resend template send failed");
    err.name = error.name || "ResendError";
    throw err;
  }
  return data;
};
