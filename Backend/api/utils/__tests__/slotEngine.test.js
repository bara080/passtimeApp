const { generateSlots, toMinutes, toHHMM } = require("../slotEngine");

const base = {
  ranges: [{ start: "09:00", end: "17:00" }],
  dayEnabled: true,
  dateBlocked: false,
  bookings: [],
  bufferMinutes: 0,
  slotMinutes: 60,
};

describe("generateSlots — basics", () => {
  test("empty when day is disabled, date is blocked, or ranges missing", () => {
    expect(generateSlots({ ...base, dayEnabled: false })).toEqual([]);
    expect(generateSlots({ ...base, dateBlocked: true })).toEqual([]);
    expect(generateSlots({ ...base, ranges: [] })).toEqual([]);
    expect(generateSlots({ ...base, ranges: undefined })).toEqual([]);
  });

  test("9-5 with 60m slots produces eight consecutive available hours", () => {
    const slots = generateSlots(base);
    expect(slots.length).toBe(8);
    expect(slots.every((s) => s.available)).toBe(true);
    expect(slots[0]).toEqual({ start: "09:00", end: "10:00", available: true });
    expect(slots[7]).toEqual({ start: "16:00", end: "17:00", available: true });
  });

  test("slot length beyond the window shortens the result", () => {
    // 9-5 with 180m slots ⇒ starts 09,10,…14 (14+3=17 fits); 15 does not.
    const slots = generateSlots({ ...base, slotMinutes: 180 });
    expect(slots.length).toBe(6);
    expect(slots.at(-1)).toEqual({ start: "14:00", end: "17:00", available: true });
  });
});

describe("generateSlots — booking conflicts", () => {
  test("marks an existing booking's hour as 'booked'", () => {
    // Booking 11:00–12:00
    const slots = generateSlots({
      ...base,
      bookings: [{ startMin: 11 * 60, endMin: 12 * 60 }],
    });
    const at11 = slots.find((s) => s.start === "11:00");
    expect(at11.available).toBe(false);
    expect(at11.reason).toBe("booked");
    expect(slots.find((s) => s.start === "10:00").available).toBe(true);
    expect(slots.find((s) => s.start === "12:00").available).toBe(true);
  });

  test("buffer extends the block on both sides", () => {
    // Booking 11:00–12:00 with 30-min buffer ⇒ 10:30 to 12:30 held.
    // 10-11 (ends 11:00) overlaps the 10:30 buffer start → booked.
    // 11-12 is the booking itself.
    // 12-13 (starts 12:00) overlaps the 12:30 buffer end → booked.
    // 09-10 and 13-14 are clear.
    const slots = generateSlots({
      ...base,
      bookings: [{ startMin: 11 * 60, endMin: 12 * 60 }],
      bufferMinutes: 30,
    });
    expect(slots.find((s) => s.start === "09:00").available).toBe(true);
    expect(slots.find((s) => s.start === "10:00").reason).toBe("booked");
    expect(slots.find((s) => s.start === "11:00").reason).toBe("booked");
    expect(slots.find((s) => s.start === "12:00").reason).toBe("booked");
    expect(slots.find((s) => s.start === "13:00").available).toBe(true);
  });

  test("touching bookings (end == start) still block their own hour but do not spill", () => {
    const slots = generateSlots({
      ...base,
      bookings: [{ startMin: 10 * 60, endMin: 11 * 60 }],
    });
    expect(slots.find((s) => s.start === "09:00").available).toBe(true);
    expect(slots.find((s) => s.start === "10:00").reason).toBe("booked");
    expect(slots.find((s) => s.start === "11:00").available).toBe(true);
  });
});

describe("generateSlots — split availability", () => {
  test("gap between morning and afternoon windows is 'unavailable'", () => {
    // Morning 09-11, afternoon 14-17. 11-14 is a hole inside the span.
    const slots = generateSlots({
      ...base,
      ranges: [
        { start: "09:00", end: "11:00" },
        { start: "14:00", end: "17:00" },
      ],
    });
    // Expect entries at 09,10,11,12,13,14,15,16
    expect(slots.map((s) => s.start)).toEqual(["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]);
    expect(slots.find((s) => s.start === "09:00").available).toBe(true);
    expect(slots.find((s) => s.start === "11:00").reason).toBe("unavailable");
    expect(slots.find((s) => s.start === "13:00").reason).toBe("unavailable");
    expect(slots.find((s) => s.start === "14:00").available).toBe(true);
  });

  test("morning slot cannot straddle a mid-day gap", () => {
    const slots = generateSlots({
      ...base,
      ranges: [
        { start: "09:00", end: "12:00" },
        { start: "14:00", end: "17:00" },
      ],
      slotMinutes: 180,
    });
    // 09-12 fits (available). 10-13 crosses the gap (unavailable).
    expect(slots.find((s) => s.start === "09:00").available).toBe(true);
    expect(slots.find((s) => s.start === "10:00").reason).toBe("unavailable");
  });
});

describe("time helpers", () => {
  test("toMinutes/toHHMM round trip", () => {
    for (const t of ["00:00", "09:30", "12:15", "23:59"]) {
      expect(toHHMM(toMinutes(t))).toBe(t);
    }
  });
});
