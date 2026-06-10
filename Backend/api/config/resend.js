const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const { data, error } = await resend.emails.send(payload);
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
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    const err = new Error(error.message || "Resend template send failed");
    err.name = error.name || "ResendError";
    throw err;
  }
  return data;
};
