const mongoose = require("mongoose");

// A member's saved (liked) host. Lives in the MEMBER cluster keyed by the
// member's uid; the host document itself lives in the host cluster and is
// joined in at read time. One row per (member, host) — the unique compound
// index makes a double-tapped heart idempotent at the storage layer.
const favoriteSchema = new mongoose.Schema(
  {
    memberUid: { type: String, required: true, index: true },
    hostUid: { type: String, required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ memberUid: 1, hostUid: 1 }, { unique: true });

module.exports = favoriteSchema;
