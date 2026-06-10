const mongoose = require("mongoose");

// Idempotency guard — prevents duplicate Stripe webhook processing
const webhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = webhookEventSchema;
