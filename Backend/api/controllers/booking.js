const { v4: uuidv4 } = require("uuid");
const Stripe = require("stripe");
const { getUserModel, getConnection } = require("../config/db");
const { success, created, error } = require("../utils/responseFormatter");
const { generateSlots } = require("../utils/slotEngine");
const { computeBookingMoney } = require("../utils/bookingMoney");
const { canTransition } = require("../utils/bookingStateMachine");
const { assertParticipant } = require("../utils/bookingParticipant");
const { EXPERIENCE_TYPES } = require("../utils/hostValidators");
const { notifyUser } = require("../utils/notifyUser");

/** Fire-and-forget push — notification outages must never fail a transition. */
function fireNotify(payload) {
  notifyUser(payload).catch((err) => console.error("[booking] notify failed:", err.message));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REASON_MAX = 500;
const PAYMENT_WINDOW_HOURS = 24;
const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || 15);

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

function isPlausibleFutureDate(d) {
  const t = d?.getTime?.();
  if (!t || Number.isNaN(t)) return false;
  return t > Date.now();
}

function isPlausibleVenue(v) {
  if (!v || typeof v !== "object") return false;
  const nameOk = typeof v.name === "string" && v.name.trim().length >= 1 && v.name.trim().length <= 120;
  const addrOk = typeof v.address === "string" && v.address.trim().length >= 1 && v.address.trim().length <= 200;
  return nameOk && addrOk;
}

function getBookingModel() {
  // Bookings live in the member cluster (booking.md section 2).
  const conn = getConnection("member");
  return conn.model("Booking");
}

// ── GET /api/bookings/slots?hostUid&date ─────────────────────────────────────
// Available hourly slots for one host on one day, derived server-side from
// the host's availability document and existing bookings (calendar 1288:7631).
exports.getSlots = async (req, res, next) => {
  try {
    const { hostUid, date } = req.query;
    if (!hostUid || typeof hostUid !== "string") return error(res, 400, "hostUid is required.");
    if (!date || !DATE_RE.test(date) || Number.isNaN(new Date(date).getTime())) {
      return error(res, 400, "date must be YYYY-MM-DD.");
    }

    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid: hostUid, isActive: true, hostOnboardingComplete: true })
      .select("availability");
    if (!host?.availability?.weekly?.length) {
      return error(res, 404, "Host availability not found.");
    }

    const { weekly, blockedDates = [], bookingConfig = {} } = host.availability;
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const dayEntry = weekly.find((d) => d.day === dayOfWeek);

    // Existing bookings that hold the host's time that day
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    const Booking = getBookingModel();
    const existing = await Booking.find({
      hostUid,
      status: { $in: ["accepted", "confirmed", "active"] },
      startAt: { $lt: dayEnd },
      endAt: { $gt: dayStart },
    }).select("startAt endAt");

    const bookings = existing.map((b) => ({
      startMin: Math.max(0, Math.floor((b.startAt - dayStart) / 60000)),
      endMin: Math.min(24 * 60, Math.ceil((b.endAt - dayStart) / 60000)),
    }));

    const slots = generateSlots({
      ranges: dayEntry?.enabled ? dayEntry.ranges : [],
      dayEnabled: Boolean(dayEntry?.enabled),
      dateBlocked: blockedDates.includes(date),
      bookings,
      bufferMinutes: bookingConfig.bufferMinutes ?? 0,
      slotMinutes: bookingConfig.minMinutes ?? 60,
    });

    return success(res, "OK", {
      date,
      hostUid,
      minMinutes: bookingConfig.minMinutes ?? 60,
      maxMinutes: bookingConfig.maxMinutes ?? 240,
      slots,
      availableCount: slots.filter((s) => s.available).length,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/bookings ───────────────────────────────────────────────────────
// Member creates a request. Server computes ALL money from host doc; the
// client's `hourlyRate`/`total` are IGNORED — this closes payment H-4.
exports.createBooking = async (req, res, next) => {
  try {
    if (req.userRole !== "member") return error(res, 403, "Only members can create bookings.");

    const { hostUid, startAt, durationMinutes, category, venue } = req.body;
    if (!hostUid || typeof hostUid !== "string") return error(res, 400, "hostUid is required.");
    if (category !== undefined && !EXPERIENCE_TYPES.includes(category)) {
      return error(res, 400, "Unknown category.");
    }
    const start = new Date(startAt);
    if (!isPlausibleFutureDate(start)) return error(res, 400, "startAt must be a future ISO datetime.");
    if (!Number.isInteger(durationMinutes)) return error(res, 400, "durationMinutes must be an integer.");
    if (!isPlausibleVenue(venue)) return error(res, 400, "venue.name (1-120) and venue.address (1-200) are required.");

    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid: hostUid, isActive: true, hostOnboardingComplete: true });
    if (!host) return error(res, 404, "Host not found.");
    if (host.uid === req.user.uid) return error(res, 400, "You cannot book yourself.");

    const cfg = host.availability?.bookingConfig || {};
    const minD = cfg.minMinutes ?? 60;
    const maxD = cfg.maxMinutes ?? 240;
    if (durationMinutes < minD || durationMinutes > maxD) {
      return error(res, 400, `durationMinutes must be between ${minD} and ${maxD}.`);
    }

    const money = computeBookingMoney({
      hourlyRateCents: host.hourlyRate,
      durationMinutes,
    });
    if (money.error) return error(res, 400, money.error);

    const end = new Date(start.getTime() + durationMinutes * 60_000);

    // Slot-conflict guard: another accepted/confirmed/active booking that overlaps this window.
    const Booking = getBookingModel();
    const conflict = await Booking.findOne({
      hostUid,
      status: { $in: ["accepted", "confirmed", "active"] },
      startAt: { $lt: end },
      endAt: { $gt: start },
    }).select("_id");
    if (conflict) return error(res, 409, "That slot is no longer available.");

    const MemberModel = getUserModel("member");
    const member = req.user; // authMiddleware already loaded the member doc
    // fallback in case of a stale req.user snapshot
    const memberFresh = member || (await MemberModel.findOne({ uid: req.user.uid }));

    const booking = await Booking.create({
      bookingId: uuidv4(),
      memberUid: req.user.uid,
      hostUid: host.uid,
      hostSnapshot: {
        displayName: host.displayName || host.firstName || "Host",
        professionalRole: host.professionalRole,
        photoUrl: host.photos?.[0]?.url || host.avatarUrl || null,
      },
      memberSnapshot: {
        displayName: memberFresh?.displayName || memberFresh?.firstName || "Member",
        photoUrl: memberFresh?.avatarUrl || null,
      },
      category: category || host.experienceTypes?.[0] || null,
      venue: {
        name: venue.name.trim(),
        address: venue.address.trim(),
        lat: typeof venue.lat === "number" ? venue.lat : undefined,
        lng: typeof venue.lng === "number" ? venue.lng : undefined,
      },
      startAt: start,
      endAt: end,
      durationMinutes,
      hourlyRateSnapshot: host.hourlyRate,
      subtotal: money.subtotal,
      serviceFee: money.serviceFee,
      tax: money.tax,
      discount: 0,
      total: money.total,
      currency: money.currency,
      status: "pending",
      logs: [{ at: new Date(), actor: "member", event: "created" }],
    });

    fireNotify({
      uid: host.uid,
      role: "host",
      title: "New booking request",
      body: `${booking.memberSnapshot.displayName} wants to book you.`,
      type: "booking_request",
      data: { bookingId: booking.bookingId },
      actorUid: req.user.uid,
    });

    return created(res, "Booking request sent.", { booking: booking.toObject() });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings/mine?window=current|upcoming|past ──────────────────────
exports.listMine = async (req, res, next) => {
  try {
    const { window = "upcoming" } = req.query;
    const now = new Date();
    const Booking = getBookingModel();

    const scope = req.userRole === "host"
      ? { hostUid: req.user.uid }
      : { memberUid: req.user.uid };

    const filters = {
      current: {
        ...scope,
        status: { $in: ["confirmed", "active"] },
        startAt: { $lte: now },
        endAt: { $gt: now },
      },
      upcoming: {
        ...scope,
        status: { $in: ["pending", "accepted", "confirmed"] },
        startAt: { $gt: now },
      },
      past: {
        ...scope,
        $or: [
          { status: { $in: ["completed", "cancelled_member", "cancelled_host", "declined", "expired_unpaid"] } },
          { endAt: { $lte: now } },
        ],
      },
    };
    if (!filters[window]) return error(res, 400, "window must be current, upcoming, or past.");

    const bookings = await Booking.find(filters[window])
      .sort(window === "past" ? { startAt: -1 } : { startAt: 1 })
      .limit(50)
      .lean();

    return success(res, "OK", { window, bookings });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/bookings/:id ────────────────────────────────────────────────────
exports.getBooking = async (req, res, next) => {
  try {
    const Booking = getBookingModel();
    const booking = await Booking.findOne({ bookingId: req.params.id });
    const gate = assertParticipant(booking, req.user.uid, req.userRole);
    if (!gate.ok) return error(res, gate.status, gate.message);
    return success(res, "OK", { booking: booking.toObject(), viewerRole: gate.role });
  } catch (err) {
    next(err);
  }
};

// ── Internal: apply a status transition safely, then run onAfter side-effects ─
async function transition(req, res, event, { actor, extraUpdates = {}, onAfter } = {}) {
  const Booking = getBookingModel();
  const booking = await Booking.findOne({ bookingId: req.params.id });
  const gate = assertParticipant(booking, req.user.uid, req.userRole);
  if (!gate.ok) return error(res, gate.status, gate.message);

  const effectiveActor = actor || gate.role;
  const decision = canTransition(booking.status, event, effectiveActor);
  if (!decision.ok) return error(res, 409, decision.message);

  booking.status = decision.to;
  Object.assign(booking, extraUpdates);
  booking.logs.push({ at: new Date(), actor: effectiveActor, event });
  await booking.save();

  // Side effects (notifications) run AFTER the write so failures don't roll
  // the transition back. onAfter itself is synchronous fire-and-forget.
  if (onAfter) {
    try { onAfter(booking); } catch (e) { console.error("[booking.transition] onAfter threw:", e.message); }
  }

  return success(res, "OK", { booking: booking.toObject() });
}

// ── POST /api/bookings/:id/accept (host) ─────────────────────────────────────
exports.accept = async (req, res, next) => {
  try {
    if (req.userRole !== "host") return error(res, 403, "Only the host can accept.");
    const paymentDueAt = new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3600_000);
    return transition(req, res, "accept", {
      actor: "host",
      extraUpdates: { paymentDueAt },
      onAfter: (b) =>
        fireNotify({
          uid: b.memberUid,
          role: "member",
          title: "Your booking was accepted",
          body: "Complete payment to confirm your session.",
          type: "booking_accepted",
          data: { bookingId: b.bookingId },
          actorUid: req.user.uid,
        }),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/bookings/:id/decline (host) ────────────────────────────────────
exports.decline = async (req, res, next) => {
  try {
    if (req.userRole !== "host") return error(res, 403, "Only the host can decline.");
    const reason = String(req.body?.reason || "").trim();
    if (reason.length === 0 || reason.length > REASON_MAX) {
      return error(res, 400, `reason is required (1-${REASON_MAX} chars).`);
    }
    return transition(req, res, "decline", {
      actor: "host",
      extraUpdates: { declineReason: reason },
      onAfter: (b) =>
        fireNotify({
          uid: b.memberUid,
          role: "member",
          title: "Your booking was declined",
          body: reason,
          type: "booking_declined",
          data: { bookingId: b.bookingId },
          actorUid: req.user.uid,
        }),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/bookings/:id/cancel (either) ───────────────────────────────────
exports.cancel = async (req, res, next) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (reason && reason.length > REASON_MAX) return error(res, 400, `reason max ${REASON_MAX} chars.`);

    // Auto-refund if the host cancels an already-paid booking (booking.md §4).
    const Booking = getBookingModel();
    const preview = await Booking.findOne({ bookingId: req.params.id });
    const gate = assertParticipant(preview, req.user.uid, req.userRole);
    if (!gate.ok) return error(res, gate.status, gate.message);
    if (gate.role === "host" && preview.status === "confirmed" && preview.paymentIntentId && stripe) {
      try {
        await stripe.refunds.create({ payment_intent: preview.paymentIntentId, reason: "requested_by_customer" });
      } catch (refundErr) {
        console.error("[booking.cancel] refund failed:", refundErr.message);
      }
    }

    const isHost = req.userRole === "host";
    const event = isHost ? "cancel_host" : "cancel_member";
    return transition(req, res, event, {
      actor: req.userRole,
      extraUpdates: reason ? { cancelReason: reason } : {},
      onAfter: (b) =>
        fireNotify({
          uid: isHost ? b.memberUid : b.hostUid,
          role: isHost ? "member" : "host",
          title: isHost ? "Host cancelled your booking" : "Member cancelled the booking",
          body: reason || "See details for more.",
          type: "booking_cancelled",
          data: { bookingId: b.bookingId },
          actorUid: req.user.uid,
        }),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/bookings/:id/_test_confirm (dev only) ──────────────────────────
// Test hook — flips a booking to `confirmed` without going through Stripe so
// downstream flows (chat unlock, reminders) can be exercised in dev + E2E.
// Guarded by NODE_ENV so it can never be called in production.
exports.testConfirm = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") return error(res, 404, "Not found.");
    const Booking = getBookingModel();
    const booking = await Booking.findOne({ bookingId: req.params.id });
    const gate = assertParticipant(booking, req.user.uid, req.userRole);
    if (!gate.ok) return error(res, gate.status, gate.message);
    if (booking.status !== "accepted") return error(res, 409, `Expected accepted, got ${booking.status}.`);
    booking.status = "confirmed";
    booking.paymentIntentId = booking.paymentIntentId || `pi_test_${Date.now()}`;
    booking.logs.push({ at: new Date(), actor: "system", event: "test_confirm" });
    await booking.save();
    return success(res, "OK", { booking: booking.toObject() });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/bookings/:id/pay ───────────────────────────────────────────────
// Member pays for an ACCEPTED booking. amount + host destination come from the
// booking row — the client sends nothing but the id. This is the fix for
// productionReadiness.md task 7.1 / payment H-4.
exports.pay = async (req, res, next) => {
  try {
    if (!stripe) return error(res, 500, "Stripe not configured.");
    if (req.userRole !== "member") return error(res, 403, "Only the member can pay.");

    const Booking = getBookingModel();
    const booking = await Booking.findOne({ bookingId: req.params.id });
    const gate = assertParticipant(booking, req.user.uid, req.userRole);
    if (!gate.ok) return error(res, gate.status, gate.message);
    if (booking.status !== "accepted") {
      return error(res, 409, `Cannot pay for a booking that is ${booking.status}.`);
    }
    if (booking.paymentDueAt && new Date(booking.paymentDueAt) < new Date()) {
      return error(res, 409, "Payment window has closed.");
    }

    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid: booking.hostUid }).select("stripeAccountId");
    if (!host?.stripeAccountId) {
      return error(res, 400, "Host has not completed Stripe onboarding.");
    }

    // Reuse the existing PaymentIntent if a payment attempt is already in flight.
    if (booking.paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
        if (["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(existing.status)) {
          return success(res, "OK", {
            paymentIntentId: existing.id,
            clientSecret: existing.client_secret,
            amount: existing.amount,
            currency: existing.currency,
          });
        }
      } catch (retrieveErr) {
        console.error("[booking.pay] existing intent lookup failed:", retrieveErr.message);
      }
    }

    const platformFee = Math.round((booking.total * PLATFORM_FEE_PERCENT) / 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.total,
      currency: booking.currency || "usd",
      payment_method_types: ["card"],
      application_fee_amount: platformFee,
      transfer_data: { destination: host.stripeAccountId },
      metadata: {
        bookingId: booking.bookingId,
        memberUid: booking.memberUid,
        hostUid: booking.hostUid,
      },
    });

    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    // Persist the payment row for reconciliation, mirroring the existing pattern.
    const conn = getConnection("member");
    const Payment = conn.model("Payment");
    await Payment.create({
      memberUid: booking.memberUid,
      hostUid: booking.hostUid,
      bookingId: booking.bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount: booking.total,
      currency: booking.currency,
      status: "pending",
    });

    return success(res, "OK", {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: booking.total,
      currency: booking.currency,
    });
  } catch (err) {
    next(err);
  }
};
