const { getConnection } = require("../config/db");
const { success, error } = require("../utils/responseFormatter");

// Payment + Booking both live in the member cluster.
function models() {
  const conn = getConnection("member");
  return { Payment: conn.model("Payment"), Booking: conn.model("Booking") };
}

// Storage status → the label the UI shows (Figma 1288:17021 uses "Released" for
// a settled charge — funds released to the host).
const STATUS_LABEL = {
  succeeded: "Released",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
  disputed: "Disputed",
};

const BOOKING_FIELDS =
  "bookingId hostSnapshot memberSnapshot category durationMinutes hourlyRateSnapshot subtotal serviceFee total currency";

/** Shape one Payment (+ its Booking, if found) into a client transaction for the
 *  given viewer role. Member sees what they paid; host sees their net payout. */
function toTransaction(p, booking, role) {
  const isHost = role === "host";
  const snap = booking ? (isHost ? booking.memberSnapshot : booking.hostSnapshot) : null;
  const net = isHost ? p.amount - (p.platformFee || 0) : p.amount;
  return {
    paymentId: String(p._id),
    bookingId: p.bookingId || null,
    transactionId: p.stripePaymentIntentId || null,
    counterpartyName: snap?.displayName || (isHost ? "Member" : "Host"),
    counterpartyPhotoUrl: snap?.photoUrl || null,
    category: booking?.category || null,
    role,
    amount: net, // headline figure for this viewer
    gross: p.amount,
    platformFee: p.platformFee || 0,
    currency: p.currency || booking?.currency || "usd",
    status: p.status,
    statusLabel: STATUS_LABEL[p.status] || p.status,
    createdAt: p.createdAt,
    // Breakdown for the detail screen (from the booking snapshot).
    hourlyRate: booking?.hourlyRateSnapshot ?? null,
    durationMinutes: booking?.durationMinutes ?? null,
    subtotal: booking?.subtotal ?? null,
    serviceFee: booking?.serviceFee ?? null,
    total: booking?.total ?? p.amount,
  };
}

// ── GET /api/payments ────────────────────────────────────────────────────────
// The requester's transactions, newest first. Member → charges they made;
// host → earnings they received.
exports.list = async (req, res, next) => {
  try {
    const { Payment, Booking } = models();
    const q = req.userRole === "host" ? { hostUid: req.user.uid } : { memberUid: req.user.uid };
    const payments = await Payment.find(q).sort({ createdAt: -1 }).limit(100).lean();
    if (payments.length === 0) return success(res, "OK", { transactions: [] });

    const bookingIds = payments.map((p) => p.bookingId).filter(Boolean);
    const bookings = await Booking.find({ bookingId: { $in: bookingIds } }).select(BOOKING_FIELDS).lean();
    const byId = new Map(bookings.map((b) => [b.bookingId, b]));

    const transactions = payments.map((p) => toTransaction(p, byId.get(p.bookingId), req.userRole));
    return success(res, "OK", { transactions });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/:paymentId ─────────────────────────────────────────────
// One transaction with the full fee breakdown, scoped to the requester so a
// member can't read a host's row (or vice-versa).
exports.detail = async (req, res, next) => {
  try {
    const { Payment, Booking } = models();
    const scope = req.userRole === "host" ? { hostUid: req.user.uid } : { memberUid: req.user.uid };
    const p = await Payment.findOne({ _id: req.params.paymentId, ...scope }).lean();
    if (!p) return error(res, 404, "Transaction not found.");

    const booking = p.bookingId ? await Booking.findOne({ bookingId: p.bookingId }).select(BOOKING_FIELDS).lean() : null;
    return success(res, "OK", { transaction: toTransaction(p, booking, req.userRole) });
  } catch (err) {
    // Malformed ObjectId → treat as not-found, not a 500.
    if (err && err.name === "CastError") return error(res, 404, "Transaction not found.");
    next(err);
  }
};
