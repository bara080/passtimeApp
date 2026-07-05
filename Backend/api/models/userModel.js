const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["member", "host"], required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    avatarUrl: { type: String },
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isSocialLogin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Host-specific
    services: [{ type: String }],
    bio: { type: String },
    // Push notifications
    pushToken: { type: String },
  },
  { timestamps: true }
);

module.exports = userSchema;
