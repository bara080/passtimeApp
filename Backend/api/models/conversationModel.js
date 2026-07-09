const mongoose = require("mongoose");

// Conversation metadata only — message bodies live in Firebase RTDB
// (chat.md §1, avoids Zinga GAP-6 unbounded embedded arrays).
const conversationSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    // Chat is booking-gated: only exists once a booking is confirmed.
    bookingId: { type: String, required: true, unique: true, index: true },
    memberUid: { type: String, required: true, index: true },
    hostUid: { type: String, required: true, index: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },

    // Denormalized preview for the list screen — updated on each sendMessage.
    lastMessage: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: null, index: true },

    // Per-role read pointer — powers unread badges (chat.md §2, fixes Zinga GAP-8).
    lastReadAt: {
      member: { type: Date, default: null },
      host: { type: Date, default: null },
    },

    // Per-user soft clear (Zinga pattern): { [uid]: Date }.
    clearedAtBy: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

conversationSchema.index({ memberUid: 1, lastMessageAt: -1 });
conversationSchema.index({ hostUid: 1, lastMessageAt: -1 });

module.exports = conversationSchema;
