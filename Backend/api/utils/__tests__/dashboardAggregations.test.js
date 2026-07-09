const {
  computeEarnings,
  computeRevenueTrend,
  computePerformance,
  computePerformanceTrend,
  computeAvailabilityThisWeek,
  hostShareCents,
  HOST_SHARE_PERCENT,
} = require("../dashboardAggregations");

// Anchor "now" to a mid-week afternoon so week/month math is unambiguous.
const NOW = new Date("2026-07-08T14:00:00Z"); // Wednesday

function booking({ status = "confirmed", subtotal = 10_000, createdAt = NOW, payAt = NOW } = {}) {
  return {
    status,
    subtotal,
    createdAt,
    logs: [
      { at: new Date(createdAt), actor: "member", event: "created" },
      { at: new Date(payAt), actor: "system", event: "pay_confirmed" },
    ],
  };
}

describe("hostShareCents", () => {
  test("rounds to nearest cent at 85%", () => {
    expect(hostShareCents({ subtotal: 10_000 })).toBe(8500);
    expect(hostShareCents({ subtotal: 999 })).toBe(Math.round(999 * HOST_SHARE_PERCENT));
    expect(hostShareCents({ subtotal: 0 })).toBe(0);
    expect(hostShareCents({})).toBe(0);
  });
});

describe("computeEarnings", () => {
  test("bucket bookings across today / this week / this month", () => {
    const bookings = [
      booking({ payAt: NOW }),                                              // today
      booking({ payAt: new Date("2026-07-06T10:00:00Z") }),                 // this week (Monday)
      booking({ payAt: new Date("2026-07-02T10:00:00Z") }),                 // earlier this month
      booking({ payAt: new Date("2026-06-25T10:00:00Z") }),                 // last month — excluded
    ];
    const { today, thisWeek, thisMonth } = computeEarnings(bookings, NOW);
    expect(today).toBe(8500);
    expect(thisWeek).toBe(8500 + 8500);
    expect(thisMonth).toBe(8500 * 3);
  });

  test("ignores non-earning statuses (pending, declined, cancelled)", () => {
    const bookings = [
      booking({ status: "pending", payAt: NOW }),
      booking({ status: "declined", payAt: NOW }),
      booking({ status: "cancelled_host", payAt: NOW }),
      booking({ status: "cancelled_member", payAt: NOW }),
      booking({ status: "confirmed", payAt: NOW }),
    ];
    expect(computeEarnings(bookings, NOW).today).toBe(8500);
  });

  test("counts active and completed as earnings", () => {
    const bookings = [
      booking({ status: "active", payAt: NOW }),
      booking({ status: "completed", payAt: NOW }),
    ];
    expect(computeEarnings(bookings, NOW).today).toBe(8500 * 2);
  });
});

describe("computeRevenueTrend", () => {
  test("returns 7 buckets, oldest first, zeros where no revenue", () => {
    const bookings = [
      booking({ payAt: new Date("2026-07-08T09:00:00Z") }),  // today
      booking({ payAt: new Date("2026-07-04T09:00:00Z") }),  // 4 days ago
    ];
    const trend = computeRevenueTrend(bookings, NOW);
    expect(trend.length).toBe(7);
    expect(trend[0].date).toBe("2026-07-02");
    expect(trend[6].date).toBe("2026-07-08");
    expect(trend.find((t) => t.date === "2026-07-04").amount).toBe(8500);
    expect(trend.find((t) => t.date === "2026-07-08").amount).toBe(8500);
    expect(trend.find((t) => t.date === "2026-07-05").amount).toBe(0);
  });
});

describe("computePerformance", () => {
  test("counts requests and accepted-or-better in the last 30 days", () => {
    const bookings = [
      booking({ status: "pending", createdAt: NOW }),
      booking({ status: "accepted", createdAt: NOW }),
      booking({ status: "confirmed", createdAt: NOW }),
      booking({ status: "declined", createdAt: NOW }),
      booking({ status: "confirmed", createdAt: new Date("2026-05-01T00:00:00Z") }), // outside 30d
    ];
    const p = computePerformance(bookings, NOW);
    expect(p.bookingRequests).toBe(4);
    expect(p.acceptedBookings).toBe(2);
    expect(p.profileViews).toBe(0);
  });
});

describe("computePerformanceTrend", () => {
  test("7 weekday-labelled buckets summing booking counts", () => {
    // Use noon UTC so the local-day mapping matches regardless of TZ.
    const bookings = [
      booking({ createdAt: new Date("2026-07-08T12:00:00Z") }),
      booking({ createdAt: new Date("2026-07-08T12:00:00Z") }),
      booking({ createdAt: new Date("2026-07-04T12:00:00Z") }),
    ];
    const t = computePerformanceTrend(bookings, NOW);
    expect(t.length).toBe(7);
    // Sum by local weekday label — the exact weekday depends on the JS
    // runtime TZ, so assert total counts + that today's bucket has 2.
    expect(t.reduce((s, x) => s + x.bookings, 0)).toBe(3);
    expect(t[6].bookings).toBe(2); // last bucket = today
    for (const b of t) expect(b.views).toBe(0);
  });
});

describe("computeAvailabilityThisWeek", () => {
  test("rolls out next 7 days honoring weekly enabled + blockedDates", () => {
    const availability = {
      weekly: [
        { day: 0, enabled: false, ranges: [] },
        { day: 1, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
        { day: 2, enabled: true, ranges: [{ start: "10:00", end: "14:00" }] },
        { day: 3, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
        { day: 4, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
        { day: 5, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
        { day: 6, enabled: false, ranges: [] },
      ],
      blockedDates: ["2026-07-09"], // block tomorrow
    };
    const days = computeAvailabilityThisWeek(availability, NOW);
    expect(days.length).toBe(7);
    expect(days[0].date).toBe("2026-07-08");
    expect(days[0].enabled).toBe(true);
    expect(days[0].windows).toEqual(["09:00-17:00"]);
    const blocked = days.find((d) => d.date === "2026-07-09");
    expect(blocked.enabled).toBe(false);
    expect(blocked.windows).toEqual([]);
    // Saturday+Sunday within window should be disabled by weekly rule
    const sat = days.find((d) => d.date === "2026-07-11");
    expect(sat.enabled).toBe(false);
  });

  test("empty availability doc yields 7 disabled days", () => {
    expect(computeAvailabilityThisWeek(undefined, NOW).every((d) => !d.enabled)).toBe(true);
  });
});
