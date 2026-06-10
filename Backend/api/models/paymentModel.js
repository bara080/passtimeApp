const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    memberUid: { type: String, required: true, index: true },
    hostUid: { type: String, required: true, index: true },
    bookingId: { type: String, index: true },
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeTransferId: { type: String },
    amount: { type: Number, required: true },   // in cents
    currency: { type: String, default: "usd" },
    platformFee: { type: Number, default: 0 },  // in cents
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded", "disputed"],
      default: "pending",
    },
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = paymentSchema;
