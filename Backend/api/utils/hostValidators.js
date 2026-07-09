const EXPERIENCE_TYPES = [
  "dinner-companion",
  "event-partner",
  "social-companion",
  "fitness-companion",
  "activity-partner",
  "networking-companion",
];

const ONBOARDING_STEPS = ["experiences", "rate", "location", "career", "availability", "photos", "done"];

const MIN_RATE_CENTS = 100; // $1
const MAX_RATE_CENTS = 100000; // $1,000/hour

function isShortString(v, max) {
  return typeof v === "string" && v.trim().length >= 1 && v.trim().length <= max;
}

/** Returns an error message or null. */
function validateExperienceTypes(types) {
  if (!Array.isArray(types) || types.length === 0) return "Select at least one experience type.";
  if (!types.every((t) => EXPERIENCE_TYPES.includes(t))) return "Unknown experience type.";
  if (new Set(types).size !== types.length) return "Duplicate experience types.";
  return null;
}

function validateHourlyRate(rate) {
  if (typeof rate !== "number" || !Number.isInteger(rate)) return "hourlyRate must be an integer (cents).";
  if (rate < MIN_RATE_CENTS || rate > MAX_RATE_CENTS) {
    return `hourlyRate must be between ${MIN_RATE_CENTS} and ${MAX_RATE_CENTS} cents.`;
  }
  return null;
}

function validateLocation(loc) {
  if (!loc || typeof loc !== "object") return "location is required.";
  for (const field of ["country", "state", "city", "address"]) {
    if (!isShortString(loc[field], 120)) return `location.${field} must be 1–120 characters.`;
  }
  return null;
}

function validateCareer({ professionalRole, bio }) {
  if (professionalRole !== undefined && !isShortString(professionalRole, 80)) {
    return "professionalRole must be 1–80 characters.";
  }
  if (bio !== undefined && !isShortString(bio, 1000)) return "bio must be 1–1000 characters.";
  return null;
}

/** Photos must live under the caller's own media path (ownership). */
function validatePhotos(photos, uid) {
  if (!Array.isArray(photos) || photos.length < 2) return "At least two photos are required.";
  if (photos.length > 9) return "At most nine photos.";
  for (const p of photos) {
    if (!p || typeof p.path !== "string" || typeof p.url !== "string") return "Invalid photo entry.";
    if (!p.path.startsWith(`media/${uid}/`)) return "Photos must be your own uploads.";
  }
  return null;
}

function validateStep(step) {
  return ONBOARDING_STEPS.includes(step) ? null : "Invalid onboarding step.";
}

module.exports = {
  EXPERIENCE_TYPES,
  ONBOARDING_STEPS,
  validateExperienceTypes,
  validateHourlyRate,
  validateLocation,
  validateCareer,
  validatePhotos,
  validateStep,
};
