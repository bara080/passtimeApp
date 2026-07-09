const {
  validateWeekly,
  validateBlockedDates,
  validateBookingConfig,
  validateAvailability,
} = require("../availabilityValidators");

const day = (overrides = {}) => ({
  day: 1,
  enabled: true,
  ranges: [{ start: "09:00", end: "17:00" }],
  ...overrides,
});

describe("validateWeekly", () => {
  test("accepts a valid week", () => {
    expect(validateWeekly([day(), day({ day: 2 })])).toBeNull();
  });
  test("rejects empty, >7, duplicate days, bad day index", () => {
    expect(validateWeekly([])).toMatch(/required/);
    expect(validateWeekly(Array.from({ length: 8 }, (_, i) => day({ day: i % 7 })))).toMatch(/7 entries|Duplicate/);
    expect(validateWeekly([day(), day()])).toMatch(/Duplicate/);
    expect(validateWeekly([day({ day: 7 })])).toMatch(/0–6/);
  });
  test("rejects malformed times and inverted ranges", () => {
    expect(validateWeekly([day({ ranges: [{ start: "9:00", end: "17:00" }] })])).toMatch(/HH:mm/);
    expect(validateWeekly([day({ ranges: [{ start: "25:00", end: "26:00" }] })])).toMatch(/HH:mm/);
    expect(validateWeekly([day({ ranges: [{ start: "17:00", end: "09:00" }] })])).toMatch(/before end/);
  });
  test("rejects overlapping ranges, accepts touching ones", () => {
    expect(
      validateWeekly([day({ ranges: [{ start: "09:00", end: "12:00" }, { start: "11:00", end: "14:00" }] })])
    ).toMatch(/overlap/);
    expect(
      validateWeekly([day({ ranges: [{ start: "09:00", end: "12:00" }, { start: "12:00", end: "14:00" }] })])
    ).toBeNull();
  });
  test("enabled day with no ranges is invalid; disabled day with none is fine", () => {
    expect(validateWeekly([day({ ranges: [] })])).toMatch(/at least one/);
    expect(validateWeekly([day({ enabled: false, ranges: [] })])).toBeNull();
  });
});

describe("validateBlockedDates", () => {
  test("accepts valid ISO dates and undefined", () => {
    expect(validateBlockedDates(["2026-08-01", "2026-08-02"])).toBeNull();
    expect(validateBlockedDates(undefined)).toBeNull();
  });
  test("rejects junk, duplicates, >90", () => {
    expect(validateBlockedDates(["08/01/2026"])).toMatch(/ISO/);
    expect(validateBlockedDates(["2026-08-01", "2026-08-01"])).toMatch(/Duplicate/);
    expect(validateBlockedDates(Array.from({ length: 91 }, (_, i) => `2026-08-${String((i % 28) + 1).padStart(2, "0")}`))).toMatch(/90/);
  });
});

describe("validateBookingConfig", () => {
  const good = { minMinutes: 60, maxMinutes: 240, bufferMinutes: 30 };
  test("accepts sane config", () => {
    expect(validateBookingConfig(good)).toBeNull();
  });
  test("rejects non-integers, out-of-range, min>max", () => {
    expect(validateBookingConfig({ ...good, minMinutes: "60" })).toMatch(/integer/);
    expect(validateBookingConfig({ ...good, minMinutes: 10 })).toMatch(/minMinutes/);
    expect(validateBookingConfig({ ...good, maxMinutes: 500 })).toMatch(/maxMinutes/);
    expect(validateBookingConfig({ ...good, minMinutes: 300, maxMinutes: 120 })).toMatch(/cannot exceed/);
    expect(validateBookingConfig({ ...good, bufferMinutes: 121 })).toMatch(/buffer/);
    expect(validateBookingConfig(null)).toMatch(/required/);
  });
});

describe("validateAvailability", () => {
  test("validates the whole document", () => {
    expect(
      validateAvailability({
        weekly: [day()],
        blockedDates: ["2026-08-01"],
        bookingConfig: { minMinutes: 60, maxMinutes: 240, bufferMinutes: 15 },
      })
    ).toBeNull();
    expect(validateAvailability(null)).toMatch(/required/);
    expect(validateAvailability({ weekly: [day()] })).toMatch(/bookingConfig/);
  });
});
