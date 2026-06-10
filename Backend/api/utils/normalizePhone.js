const DIAL_CODES = {
  US: "1",  CA: "1",  MX: "52",
  GB: "44", IE: "353", FR: "33", DE: "49", IT: "39", ES: "34",
  NL: "31", BE: "32",  AU: "61", NZ: "64",
  IN: "91", CN: "86",  JP: "81", SG: "65", AE: "971", SA: "966",
  BR: "55", NG: "234", ZA: "27", KE: "254",
};

/**
 * Normalise a phone number to E.164 format (+XXXXXXXXXXX).
 * Requires a leading + or an ISO 3166-1 alpha-2 country code hint.
 */
function normalizePhone(phone, countryCode) {
  if (!phone || typeof phone !== "string" || !phone.trim()) return null;
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return /^\+\d{10,15}$/.test(trimmed) ? trimmed : null;
  }

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  const iso = countryCode?.toUpperCase?.();
  if (iso && DIAL_CODES[iso]) {
    const dialCode = DIAL_CODES[iso];
    if ((iso === "GB" || iso === "IE") && digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    const candidate = digits.startsWith(dialCode) ? `+${digits}` : `+${dialCode}${digits}`;
    return /^\+\d{10,15}$/.test(candidate) ? candidate : null;
  }

  return null;
}

module.exports = { normalizePhone };
