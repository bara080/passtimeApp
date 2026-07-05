const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}' -]{0,49}$/u;

const MIN_AGE_YEARS = 18;
const MAX_AGE_YEARS = 100;

function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

/** Returns an error message or null. */
function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) return "Password is too long.";
  return null;
}

/** Returns an error message or null. Letters (any language), spaces, hyphens, apostrophes; 1–50 chars. */
function validateName(name, label) {
  if (typeof name !== "string" || !NAME_RE.test(name.trim())) {
    return `${label} must be 1–50 letters.`;
  }
  return null;
}

/** Accepts ISO date string; returns { error } or { date }. Age must be 18–100. */
function validateDateOfBirth(value) {
  const date = new Date(value);
  if (typeof value !== "string" || Number.isNaN(date.getTime())) {
    return { error: "dateOfBirth must be a valid ISO date." };
  }
  const now = new Date();
  const age = (now - date) / (365.25 * 24 * 3600 * 1000);
  if (age < MIN_AGE_YEARS) return { error: `You must be at least ${MIN_AGE_YEARS} years old.` };
  if (age > MAX_AGE_YEARS) return { error: "dateOfBirth is not a plausible date." };
  return { date };
}

module.exports = { isValidEmail, validatePassword, validateName, validateDateOfBirth };
