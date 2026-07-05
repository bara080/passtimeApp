// Client-side mirrors of Backend/api/utils/validators.js — keep rules in sync.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}' -]{0,49}$/u;

export const MIN_AGE_YEARS = 18;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Returns an error message or null. */
export function validateName(name: string, label: string): string | null {
  if (!NAME_RE.test(name.trim())) return `${label} must be 1–50 letters.`;
  return null;
}

/** Validates an ISO "YYYY-MM-DD" birth date. Returns an error message or undefined. */
export function validateDateOfBirthIso(iso: string): string | undefined {
  if (!iso) return "Please select your birth date.";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid date.";
  const age = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < MIN_AGE_YEARS) return `You must be at least ${MIN_AGE_YEARS} years old.`;
  if (age > 100) return "Please check your birth date.";
  return undefined;
}
