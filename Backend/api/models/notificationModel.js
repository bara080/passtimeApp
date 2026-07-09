const mongoose = require("mongoose");

// Notification model — the in-app feed. Also mirrors the payload used by push.
// Dedupe: `{ uid, role, key }` is unique when `key` is present (partial index),
// so retryable events (e.g. cron reminders) never double-fire (pattern extracted
// from Zinga notificationModel.js).
const notificationSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    role: { type: String, enum: ["member", "host"], required: true },

    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: [
        "booking_request",
        "booking_accepted",
        "booking_declined",
        "booking_cancelled",
        "booking_reminder",
        "payment_success",
        "chat_message",
        "general",
      ],
      required: true,
      index: true,
    },

    /** Deep-link routing hints — `{ bookingId }`, `{ chatId }`, etc. */
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    /** Idempotency key. `booking_reminder:{bookingId}:20m` collapses replays. */
    key: { type: String, index: true },

    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index(
  { uid: 1, role: 1, key: 1 },
  { unique: true, partialFilterExpression: { key: { $exists: true, $type: "string" } } }
);
notificationSchema.index({ uid: 1, createdAt: -1 });

module.exports = notificationSchema;
