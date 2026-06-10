const mongoose = require("mongoose");

// Stores short-lived email OTP codes (6 digits, 10-min expiry)
const verificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    token: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = verificationSchema;
