const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MIN_CONFIG_MINUTES = 15;
const MAX_CONFIG_MINUTES = 480;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Returns an error message or null. */
function validateWeekly(weekly) {
  if (!Array.isArray(weekly) || weekly.length === 0) return "weekly schedule is required.";
  if (weekly.length > 7) return "weekly cannot exceed 7 entries.";
  const seen = new Set();
  for (const entry of weekly) {
    if (!entry || typeof entry !== "object") return "Invalid weekly entry.";
    if (!Number.isInteger(entry.day) || entry.day < 0 || entry.day > 6) return "day must be 0–6.";
    if (seen.has(entry.day)) return "Duplicate day in weekly schedule.";
    seen.add(entry.day);
    if (typeof entry.enabled !== "boolean") return "enabled must be a boolean.";
    if (!Array.isArray(entry.ranges)) return "ranges must be an array.";
    if (entry.enabled && entry.ranges.length === 0) return "Enabled days need at least one time range.";
    if (entry.ranges.length > 4) return "At most 4 time ranges per day.";

    const spans = [];
    for (const r of entry.ranges) {
      if (!r || !TIME_RE.test(r.start) || !TIME_RE.test(r.end)) return "Time ranges must be HH:mm.";
      const start = toMinutes(r.start);
      const end = toMinutes(r.end);
      if (start >= end) return "Range start must be before end.";
      spans.push([start, end]);
    }
    spans.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) {
      if (spans[i][0] < spans[i - 1][1]) return "Time ranges must not overlap.";
    }
  }
  return null;
}

function validateBlockedDates(dates) {
  if (dates === undefined) return null;
  if (!Array.isArray(dates)) return "blockedDates must be an array.";
  if (dates.length > 90) return "At most 90 blocked dates.";
  for (const d of dates) {
    if (typeof d !== "string" || !DATE_RE.test(d) || Number.isNaN(new Date(d).getTime())) {
      return "blockedDates must be ISO dates (YYYY-MM-DD).";
    }
  }
  if (new Set(dates).size !== dates.length) return "Duplicate blocked dates.";
  return null;
}

function validateBookingConfig(config) {
  if (!config || typeof config !== "object") return "bookingConfig is required.";
  const { minMinutes, maxMinutes, bufferMinutes } = config;
  for (const [name, v] of [["minMinutes", minMinutes], ["maxMinutes", maxMinutes], ["bufferMinutes", bufferMinutes]]) {
    if (!Number.isInteger(v)) return `${name} must be an integer.`;
  }
  if (minMinutes < MIN_CONFIG_MINUTES || minMinutes > MAX_CONFIG_MINUTES) {
    return `minMinutes must be ${MIN_CONFIG_MINUTES}–${MAX_CONFIG_MINUTES}.`;
  }
  if (maxMinutes < MIN_CONFIG_MINUTES || maxMinutes > MAX_CONFIG_MINUTES) {
    return `maxMinutes must be ${MIN_CONFIG_MINUTES}–${MAX_CONFIG_MINUTES}.`;
  }
  if (minMinutes > maxMinutes) return "minMinutes cannot exceed maxMinutes.";
  if (bufferMinutes < 0 || bufferMinutes > 120) return "bufferMinutes must be 0–120.";
  return null;
}

/** Full-document validation for PUT /host/availability. */
function validateAvailability(body) {
  if (!body || typeof body !== "object") return "availability document is required.";
  return (
    validateWeekly(body.weekly) ||
    validateBlockedDates(body.blockedDates) ||
    validateBookingConfig(body.bookingConfig)
  );
}

module.exports = {
  validateWeekly,
  validateBlockedDates,
  validateBookingConfig,
  validateAvailability,
};
