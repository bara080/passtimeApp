// Client-side preview of booking totals. Numbers are AUTHORITATIVE on the
// server (booking.md §2, Backend/api/utils/bookingMoney.js) — this is only for
// showing line items live as the member adjusts the duration stepper.

const SERVICE_FEE_PERCENT = 3.5;
const TAX_PERCENT = 5.5;

export type MoneyPreview = {
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
};

export function previewBookingMoney(hourlyRateCents: number, durationMinutes: number, discountCents = 0): MoneyPreview {
  const subtotal = Math.round((hourlyRateCents * durationMinutes) / 60);
  const afterDiscount = Math.max(0, subtotal - discountCents);
  const serviceFee = Math.round((afterDiscount * SERVICE_FEE_PERCENT) / 100);
  const tax = Math.round((afterDiscount * TAX_PERCENT) / 100);
  return { subtotal, serviceFee, tax, total: afterDiscount + serviceFee + tax };
}

/** Format cents as "$1,234.56". */
export function formatMoney(cents: number, currency = "usd"): string {
  const value = cents / 100;
  const symbol = currency.toLowerCase() === "usd" ? "$" : "";
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
