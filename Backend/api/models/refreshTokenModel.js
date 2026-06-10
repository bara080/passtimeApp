const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    deviceInfo: { type: String },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = refreshTokenSchema;
