const mongoose = require("mongoose");

// Booking lives in the MEMBER cluster (memberUid owns the request lifecycle).
// Money fields are ALWAYS server-computed cents — never trusted from a client.
const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    memberUid: { type: String, required: true, index: true },
    hostUid: { type: String, required: true, index: true },

    // Snapshots at request time — history survives later profile edits (Zinga pattern)
    hostSnapshot: {
      displayName: String,
      professionalRole: String,
      photoUrl: String,
    },
    memberSnapshot: {
      displayName: String,
      photoUrl: String,
    },
    category: { type: String },
    venue: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      lat: Number,
      lng: Number,
    },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    hourlyRateSnapshot: { type: Number, required: true }, // cents
    subtotal: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "declined",
        "confirmed",
        "expired_unpaid",
        "cancelled_member",
        "cancelled_host",
        "active",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    cancelReason: { type: String, trim: true },
    declineReason: { type: String, trim: true },
    paymentIntentId: { type: String },
    paymentDueAt: { type: Date },

    logs: [
      {
        at: { type: Date, default: Date.now },
        actor: String, // "member" | "host" | "system"
        event: String,
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.index({ memberUid: 1, status: 1 });
bookingSchema.index({ hostUid: 1, status: 1 });
bookingSchema.index({ hostUid: 1, startAt: 1 }); // slot-conflict lookups

module.exports = bookingSchema;
