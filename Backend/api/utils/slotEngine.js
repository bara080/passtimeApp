// Slot generation for the booking calendar (Figma 1288:7631, booking.md section 3).
// Pure functions over minutes-of-day so every rule is unit-testable.
//
// v1 timezone stance: times are naive wall-clock (host availability HH:mm and
// the requested date are treated in one shared timezone). A host `timezone`
// field is the planned upgrade — documented deviation in booking.md.

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Generate hourly slot entries for one day.
 *
 * @param {object} args
 * @param {Array<{start:string,end:string}>} args.ranges  enabled availability ranges for the weekday ([] = day off)
 * @param {boolean} args.dayEnabled                        weekly[day].enabled
 * @param {boolean} args.dateBlocked                       date in availability.blockedDates
 * @param {Array<{startMin:number,endMin:number}>} args.bookings  existing accepted/confirmed/active bookings that day
 * @param {number} args.bufferMinutes                      gap required around bookings
 * @param {number} args.slotMinutes                        booking length used for fit checks (bookingConfig.minMinutes)
 * @returns {Array<{start:string,end:string,available:boolean,reason?:"unavailable"|"booked"}>}
 *          One entry per hour-start that intersects the availability span; "unavailable"
 *          for holes inside the span, "booked" for booking/buffer conflicts.
 */
function generateSlots({ ranges, dayEnabled, dateBlocked, bookings, bufferMinutes, slotMinutes }) {
  if (!dayEnabled || dateBlocked || !Array.isArray(ranges) || ranges.length === 0) {
    return [];
  }

  const windows = ranges
    .map((r) => [toMinutes(r.start), toMinutes(r.end)])
    .sort((a, b) => a[0] - b[0]);

  const spanStart = windows[0][0];
  const spanEnd = windows[windows.length - 1][1];

  // Bookings expand by the buffer on both sides.
  const blocked = bookings.map(({ startMin, endMin }) => [
    Math.max(0, startMin - bufferMinutes),
    endMin + bufferMinutes,
  ]);

  const slots = [];
  // Hour-start grid across the availability span (design shows hourly rows).
  const firstHour = Math.ceil(spanStart / 60) * 60;
  for (let start = firstHour; start + slotMinutes <= spanEnd; start += 60) {
    const end = start + slotMinutes;

    const insideWindow = windows.some(([ws, we]) => start >= ws && end <= we);
    if (!insideWindow) {
      slots.push({ start: toHHMM(start), end: toHHMM(end), available: false, reason: "unavailable" });
      continue;
    }

    const conflicts = blocked.some(([bs, be]) => start < be && end > bs);
    if (conflicts) {
      slots.push({ start: toHHMM(start), end: toHHMM(end), available: false, reason: "booked" });
      continue;
    }

    slots.push({ start: toHHMM(start), end: toHHMM(end), available: true });
  }

  return slots;
}

module.exports = { generateSlots, toMinutes, toHHMM };
