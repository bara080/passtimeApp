import { parsePhoneNumberFromString, getExampleNumber, CountryCode, PhoneNumber } from "libphonenumber-js";

export type { CountryCode };

export function isValidPhoneNumber(nationalNumber: string, countryCode: CountryCode): boolean {
  try {
    const phone = parsePhoneNumberFromString(nationalNumber, countryCode);
    return !!phone && phone.isValid();
  } catch {
    return false;
  }
}

export function toE164FromCallingCodeAndNational(
  callingCode: string,
  nationalNumber: string
): string | null {
  try {
    const raw = `+${callingCode}${nationalNumber.replace(/\D/g, "")}`;
    const phone = parsePhoneNumberFromString(raw);
    if (!phone || !phone.isValid()) return null;
    return phone.format("E.164");
  } catch {
    return null;
  }
}

export function splitStoredPhoneForForm(e164: string): {
  callingCode: string;
  national: string;
  countryCode: CountryCode | null;
} {
  try {
    const phone = parsePhoneNumberFromString(e164) as PhoneNumber;
    if (!phone) return { callingCode: "1", national: e164, countryCode: null };
    return {
      callingCode: String(phone.countryCallingCode),
      national: phone.nationalNumber,
      countryCode: (phone.country as CountryCode) ?? null,
    };
  } catch {
    return { callingCode: "1", national: e164, countryCode: null };
  }
}

export function getMaxDigitsForCountry(countryCode: CountryCode): number {
  try {
    const example = getExampleNumber(countryCode, { v: 2 } as never);
    return example ? example.nationalNumber.length : 15;
  } catch {
    return 15;
  }
}

export const POPULAR_CALLING_CODES: { code: string; country: CountryCode; label: string }[] = [
  { code: "1", country: "US", label: "🇺🇸 +1" },
  { code: "44", country: "GB", label: "🇬🇧 +44" },
  { code: "61", country: "AU", label: "🇦🇺 +61" },
  { code: "91", country: "IN", label: "🇮🇳 +91" },
  { code: "971", country: "AE", label: "🇦🇪 +971" },
  { code: "966", country: "SA", label: "🇸🇦 +966" },
  { code: "49", country: "DE", label: "🇩🇪 +49" },
  { code: "33", country: "FR", label: "🇫🇷 +33" },
  { code: "34", country: "ES", label: "🇪🇸 +34" },
  { code: "39", country: "IT", label: "🇮🇹 +39" },
  { code: "55", country: "BR", label: "🇧🇷 +55" },
  { code: "52", country: "MX", label: "🇲🇽 +52" },
  { code: "1", country: "CA", label: "🇨🇦 +1 (CA)" },
  { code: "64", country: "NZ", label: "🇳🇿 +64" },
  { code: "27", country: "ZA", label: "🇿🇦 +27" },
];
