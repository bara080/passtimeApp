const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    uid: { type: String, required: true },
    code: { type: String, required: true },
    // TTL index defined below via schema.index() — no field-level `index: true`
    // (Mongoose logs a duplicate-index warning otherwise).
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-removes expired docs
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = passwordResetSchema;
