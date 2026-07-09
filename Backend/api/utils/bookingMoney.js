// Server-authoritative booking money (booking.md section 2). All values in
// cents. The client NEVER sends amounts — this module is the ONLY price source.
// This is the fix for productionReadiness.md task 7.1 (payment H-4).

const SERVICE_FEE_PERCENT = 3.5; // member-side platform fee, matches Figma 9847
const TAX_PERCENT = 5.5;         // flat v1; a real tax service replaces this later
const MIN_DURATION_MINUTES = 15;
const MAX_DURATION_MINUTES = 480;

/**
 * Compute the full money block for a booking.
 * Returns { error } on invalid input, or the money block on success.
 */
function computeBookingMoney({ hourlyRateCents, durationMinutes, discountCents = 0 }) {
  if (!Number.isInteger(hourlyRateCents) || hourlyRateCents < 100) {
    return { error: "hourlyRateCents must be an integer >= 100." };
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES) {
    return { error: `durationMinutes must be an integer >= ${MIN_DURATION_MINUTES}.` };
  }
  if (durationMinutes > MAX_DURATION_MINUTES) {
    return { error: `durationMinutes must be <= ${MAX_DURATION_MINUTES}.` };
  }
  if (!Number.isInteger(discountCents) || discountCents < 0) {
    return { error: "discountCents must be a non-negative integer." };
  }

  const subtotal = Math.round((hourlyRateCents * durationMinutes) / 60);
  const afterDiscount = Math.max(0, subtotal - discountCents);
  const serviceFee = Math.round((afterDiscount * SERVICE_FEE_PERCENT) / 100);
  const tax = Math.round((afterDiscount * TAX_PERCENT) / 100);
  const total = afterDiscount + serviceFee + tax;

  return {
    subtotal,
    discount: discountCents,
    serviceFee,
    tax,
    total,
    currency: "usd",
  };
}

module.exports = { computeBookingMoney, SERVICE_FEE_PERCENT, TAX_PERCENT, MIN_DURATION_MINUTES, MAX_DURATION_MINUTES };
