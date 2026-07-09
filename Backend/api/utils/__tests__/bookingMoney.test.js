const { computeBookingMoney } = require("../bookingMoney");

describe("computeBookingMoney", () => {
  test("2h @ $50/h yields subtotal + fee + tax + total", () => {
    const r = computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 120 });
    expect(r.subtotal).toBe(10_000);      // $100
    expect(r.serviceFee).toBe(350);        // 3.5% of $100
    expect(r.tax).toBe(550);               // 5.5% of $100
    expect(r.total).toBe(10_900);          // sum
    expect(r.currency).toBe("usd");
    expect(r.discount).toBe(0);
  });

  test("3h @ $50/h matches the Figma 9847 summary line-items", () => {
    const r = computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 180 });
    expect(r.subtotal).toBe(15_000);       // $150
    expect(r.serviceFee).toBe(525);        // Figma: $5.25 area (3.5% flat)
    expect(r.tax).toBe(825);
    expect(r.total).toBe(16_350);
  });

  test("half-hour blocks compute correctly (90 min)", () => {
    const r = computeBookingMoney({ hourlyRateCents: 6000, durationMinutes: 90 });
    expect(r.subtotal).toBe(9_000);
  });

  test("discount reduces subtotal before fee and tax", () => {
    const r = computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 120, discountCents: 1_000 });
    expect(r.discount).toBe(1_000);
    expect(r.subtotal).toBe(10_000);
    // fee/tax computed on $90
    expect(r.serviceFee).toBe(315);
    expect(r.tax).toBe(495);
    expect(r.total).toBe(9_000 + 315 + 495);
  });

  test("discount larger than subtotal clamps to zero, never negative", () => {
    const r = computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 60, discountCents: 999_999 });
    expect(r.total).toBe(0);
    expect(r.serviceFee).toBe(0);
    expect(r.tax).toBe(0);
  });

  test("rejects non-integer rate", () => {
    expect(computeBookingMoney({ hourlyRateCents: 50.5, durationMinutes: 60 }).error).toMatch(/hourlyRateCents/);
  });

  test("rejects too-short and too-long durations", () => {
    expect(computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 10 }).error).toMatch(/>= 15/);
    expect(computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 999 }).error).toMatch(/<= 480/);
  });

  test("rejects negative discount", () => {
    expect(computeBookingMoney({ hourlyRateCents: 5000, durationMinutes: 60, discountCents: -1 }).error).toMatch(/non-negative/);
  });

  test("rejects rate below the $1 floor", () => {
    expect(computeBookingMoney({ hourlyRateCents: 50, durationMinutes: 60 }).error).toMatch(/hourlyRateCents/);
  });
});
