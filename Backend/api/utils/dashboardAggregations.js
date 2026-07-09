// Host dashboard aggregations — pure functions over an array of Booking rows
// so every rule is unit-testable without a Mongo round-trip. Money in cents.

const HOST_SHARE_PERCENT = 0.85; // Platform keeps 15% (Stripe application_fee_amount)
const EARNING_STATUSES = new Set(["confirmed", "active", "completed"]);
const ACCEPTED_STATUSES = new Set(["accepted", "confirmed", "active", "completed"]);

/** Returns 00:00:00 local wall-clock as a Date. Timezone-naive by design
 *  matching the rest of the app (host availability is HH:mm wall-clock). */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // shift to Monday-first week
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function isoDate(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

/** Host's take-home share of a booking's subtotal in cents. */
function hostShareCents(booking) {
  return Math.round((booking.subtotal || 0) * HOST_SHARE_PERCENT);
}

/** The date a booking's revenue counts against — pay_confirmed transition log
 *  entry timestamp, else createdAt as a fallback. */
function revenueDateOf(booking) {
  const log = Array.isArray(booking.logs)
    ? booking.logs.find((l) => l.event === "pay_confirmed") ??
      booking.logs.find((l) => l.event === "accept")
    : null;
  return log?.at ? new Date(log.at) : booking.createdAt ? new Date(booking.createdAt) : new Date();
}

/** { today, thisWeek, thisMonth } — all in cents. */
function computeEarnings(bookings, now = new Date()) {
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const monthStart = startOfMonth(now).getTime();
  let today = 0, thisWeek = 0, thisMonth = 0;
  for (const b of bookings) {
    if (!EARNING_STATUSES.has(b.status)) continue;
    const cents = hostShareCents(b);
    const ts = revenueDateOf(b).getTime();
    if (ts >= dayStart) today += cents;
    if (ts >= weekStart) thisWeek += cents;
    if (ts >= monthStart) thisMonth += cents;
  }
  return { today, thisWeek, thisMonth };
}

/** Last 7 days, oldest-first — [{ date: "YYYY-MM-DD", amount: cents }]. */
function computeRevenueTrend(bookings, now = new Date(), days = 7) {
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    buckets.set(isoDate(d), 0);
  }
  const cutoff = startOfDay(now).getTime() - (days - 1) * 24 * 3600_000;
  for (const b of bookings) {
    if (!EARNING_STATUSES.has(b.status)) continue;
    const rd = revenueDateOf(b);
    if (rd.getTime() < cutoff) continue;
    const key = isoDate(rd);
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + hostShareCents(b));
  }
  return [...buckets.entries()].map(([date, amount]) => ({ date, amount }));
}

/** Rolling 30-day counts of booking requests and accepted-or-better transitions. */
function computePerformance(bookings, now = new Date(), days = 30) {
  const cutoff = now.getTime() - days * 24 * 3600_000;
  let bookingRequests = 0;
  let acceptedBookings = 0;
  for (const b of bookings) {
    const created = new Date(b.createdAt || 0).getTime();
    if (created < cutoff) continue;
    bookingRequests++;
    if (ACCEPTED_STATUSES.has(b.status)) acceptedBookings++;
  }
  // profileViews requires an events collection we don't have yet — v1 stub.
  return { profileViews: 0, bookingRequests, acceptedBookings };
}

/** Last 7 days by weekday label — [{ day, views, bookings }]. */
function computePerformanceTrend(bookings, now = new Date(), days = 7) {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    buckets.set(isoDate(d), { day: dayLabels[d.getDay()], views: 0, bookings: 0 });
  }
  const cutoff = startOfDay(now).getTime() - (days - 1) * 24 * 3600_000;
  for (const b of bookings) {
    const created = new Date(b.createdAt || 0);
    if (created.getTime() < cutoff) continue;
    const key = isoDate(created);
    const bucket = buckets.get(key);
    if (bucket) bucket.bookings += 1;
  }
  return [...buckets.values()];
}

/** Next 7 days rolled out from the host's weekly availability doc. */
function computeAvailabilityThisWeek(availability, now = new Date(), days = 7) {
  const weekly = availability?.weekly ?? [];
  const blocked = new Set(availability?.blockedDates ?? []);
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + i);
    const date = isoDate(d);
    const dayEntry = weekly.find((w) => w.day === d.getDay());
    if (blocked.has(date) || !dayEntry?.enabled) {
      out.push({ date, enabled: false, windows: [] });
      continue;
    }
    out.push({
      date,
      enabled: true,
      windows: (dayEntry.ranges || []).map((r) => `${r.start}-${r.end}`),
    });
  }
  return out;
}

module.exports = {
  computeEarnings,
  computeRevenueTrend,
  computePerformance,
  computePerformanceTrend,
  computeAvailabilityThisWeek,
  // exported for tests
  hostShareCents,
  revenueDateOf,
  HOST_SHARE_PERCENT,
};
