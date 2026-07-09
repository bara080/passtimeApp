const { getUserModel } = require("../config/db");
const { toPublicHostCard } = require("../utils/publicProjections");
const { EXPERIENCE_TYPES } = require("../utils/hostValidators");
const { success, error } = require("../utils/responseFormatter");
const { validateAvailability } = require("../utils/availabilityValidators");
const {
  validateExperienceTypes,
  validateHourlyRate,
  validateLocation,
  validateCareer,
  validatePhotos,
  validateStep,
} = require("../utils/hostValidators");

// ── PATCH /api/host/onboarding ────────────────────────────────────────────────
// Accepts one step's fields at a time; every provided field is validated,
// unknown fields are ignored (allowlist), and the resume pointer advances.
exports.updateOnboarding = async (req, res, next) => {
  try {
    if (req.userRole !== "host") return error(res, 403, "Host account required.");

    const { experienceTypes, hourlyRate, location, professionalRole, bio, photos, step } = req.body;

    const stepError = validateStep(step);
    if (stepError) return error(res, 400, stepError);

    const update = {};

    if (experienceTypes !== undefined) {
      const msg = validateExperienceTypes(experienceTypes);
      if (msg) return error(res, 400, msg);
      update.experienceTypes = experienceTypes;
    }
    if (hourlyRate !== undefined) {
      const msg = validateHourlyRate(hourlyRate);
      if (msg) return error(res, 400, msg);
      update.hourlyRate = hourlyRate;
      update.currency = "usd";
    }
    if (location !== undefined) {
      const msg = validateLocation(location);
      if (msg) return error(res, 400, msg);
      update.location = {
        country: location.country.trim(),
        state: location.state.trim(),
        city: location.city.trim(),
        address: location.address.trim(),
      };
    }
    if (professionalRole !== undefined || bio !== undefined) {
      const msg = validateCareer({ professionalRole, bio });
      if (msg) return error(res, 400, msg);
      if (professionalRole !== undefined) update.professionalRole = professionalRole.trim();
      if (bio !== undefined) update.bio = bio.trim();
    }
    if (photos !== undefined) {
      const msg = validatePhotos(photos, req.user.uid);
      if (msg) return error(res, 400, msg);
      update.photos = photos.map((p) => ({ path: p.path, url: p.url }));
    }

    if (Object.keys(update).length === 0 && step !== "done") {
      return error(res, 400, "No valid fields provided.");
    }

    update.hostOnboardingStep = step;
    if (step === "done") update.hostOnboardingComplete = true;

    const HostModel = getUserModel("host");
    await HostModel.updateOne({ uid: req.user.uid }, update);

    return success(res, "Onboarding progress saved.", {
      hostOnboardingStep: step,
      hostOnboardingComplete: step === "done",
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/host/availability ────────────────────────────────────────────────
// Full-document replace: weekly schedule, blocked dates, booking config.
exports.updateAvailability = async (req, res, next) => {
  try {
    if (req.userRole !== "host") return error(res, 403, "Host account required.");

    const msg = validateAvailability(req.body);
    if (msg) return error(res, 400, msg);

    const { weekly, blockedDates = [], bookingConfig } = req.body;
    const availability = {
      weekly: weekly.map((d) => ({
        day: d.day,
        enabled: d.enabled,
        ranges: d.ranges.map((r) => ({ start: r.start, end: r.end })),
      })),
      blockedDates,
      bookingConfig: {
        minMinutes: bookingConfig.minMinutes,
        maxMinutes: bookingConfig.maxMinutes,
        bufferMinutes: bookingConfig.bufferMinutes,
      },
    };

    const HostModel = getUserModel("host");
    await HostModel.updateOne(
      { uid: req.user.uid },
      { availability, hostOnboardingStep: "availability" }
    );

    return success(res, "Availability saved.", { availability });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hosts/discover ───────────────────────────────────────────────────
// Member-facing host discovery. Only fully-onboarded, active hosts; results
// pass through the public projection allowlist (privacy boundary).
exports.discoverHosts = async (req, res, next) => {
  try {
    const { section = "recommended", category, city } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 20);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    if (!["recommended", "nearby"].includes(section)) {
      return error(res, 400, "section must be 'recommended' or 'nearby'.");
    }
    if (category !== undefined && !EXPERIENCE_TYPES.includes(category)) {
      return error(res, 400, "Unknown category.");
    }

    const query = { hostOnboardingComplete: true, isActive: true };
    if (category) query.experienceTypes = category;
    // "nearby" v1: same-city match when the client provides one; falls back to
    // the recommended ordering otherwise (no geo coordinates collected yet).
    if (section === "nearby" && typeof city === "string" && city.trim()) {
      query["location.city"] = new RegExp(`^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const HostModel = getUserModel("host");
    const hosts = await HostModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select("uid displayName firstName dateOfBirth photos avatarUrl location experienceTypes hourlyRate currency");

    return success(res, "OK", {
      section,
      hosts: hosts.map(toPublicHostCard),
      offset,
      limit,
    });
  } catch (err) {
    next(err);
  }
};
