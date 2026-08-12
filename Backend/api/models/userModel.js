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
    deletedAt: { type: Date, default: null },
    // Host-specific
    services: [{ type: String }],
    bio: { type: String },
    experienceTypes: [{ type: String }],
    hourlyRate: { type: Number }, // cents
    currency: { type: String, default: "usd" },
    location: {
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    professionalRole: { type: String, trim: true },
    photos: [{ path: String, url: String }],
    // Stripe Connect (host). Defined so the onboarding write of `stripeAccountId`
    // and the `account.updated` webhook's `stripe.*` flags actually persist —
    // strict mode was silently dropping them before these fields existed.
    stripeAccountId: { type: String },
    stripe: {
      chargesEnabled: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
      payoutReady: { type: Boolean, default: false },
    },
    // Identity (KYC) verification status. `pending` = submitted, awaiting review.
    identity: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified",
      },
      documentType: { type: String, enum: ["passport", "drivers_license", "national_id"] },
      documents: {
        front: { type: String }, // https URLs from the media pipeline
        back: { type: String },
        selfie: { type: String },
      },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
    },
    availability: {
      weekly: [
        {
          day: { type: Number, min: 0, max: 6 },
          enabled: { type: Boolean, default: false },
          ranges: [{ start: String, end: String }],
        },
      ],
      blockedDates: [{ type: String }],
      bookingConfig: {
        minMinutes: { type: Number },
        maxMinutes: { type: Number },
        bufferMinutes: { type: Number },
      },
    },
    hostOnboardingStep: { type: String, default: null },
    hostOnboardingComplete: { type: Boolean, default: false },
    // Push notifications
    // Legacy single-token field (kept for the current binary; new writes go to expoPushTokens).
    pushToken: { type: String },
    // Multi-device push tokens (Zinga pattern) — dedupe by (token) at write time.
    expoPushTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, enum: ["ios", "android"] },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = userSchema;
