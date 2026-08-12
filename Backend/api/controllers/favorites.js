const { getConnection, getUserModel } = require("../config/db");
const { toPublicHostCard } = require("../utils/publicProjections");
const { success, created, error } = require("../utils/responseFormatter");

// Same allowlist the discovery feed uses — keep in sync with host.discoverHosts.
const HOST_CARD_FIELDS =
  "uid displayName firstName dateOfBirth photos avatarUrl location experienceTypes hourlyRate currency";

function favoriteModel() {
  return getConnection("member").model("Favorite");
}

// ── GET /api/favorites ───────────────────────────────────────────────────────
// The member's saved hosts as discovery cards, most-recently-saved first.
exports.list = async (req, res, next) => {
  try {
    const Favorite = favoriteModel();
    const favs = await Favorite.find({ memberUid: req.user.uid }).sort({ createdAt: -1 }).lean();
    if (favs.length === 0) return success(res, "OK", { hosts: [], count: 0 });

    const order = favs.map((f) => f.hostUid);
    const hosts = await getUserModel("host").find({ uid: { $in: order } }).select(HOST_CARD_FIELDS).lean();
    const byUid = new Map(hosts.map((h) => [h.uid, h]));
    // Preserve save order; silently drop any host that no longer exists.
    const cards = order.map((uid) => byUid.get(uid)).filter(Boolean).map(toPublicHostCard);

    return success(res, "OK", { hosts: cards, count: cards.length });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/favorites/:hostUid ─────────────────────────────────────────────
// Save a host. Idempotent: an upsert keyed on (member, host) + the unique index
// means a double-tapped heart never creates a duplicate.
exports.add = async (req, res, next) => {
  try {
    const { hostUid } = req.params;
    if (!hostUid) return error(res, 400, "hostUid is required.");
    if (hostUid === req.user.uid) return error(res, 400, "You cannot favorite yourself.");

    const Favorite = favoriteModel();
    await Favorite.findOneAndUpdate(
      { memberUid: req.user.uid, hostUid },
      { $setOnInsert: { memberUid: req.user.uid, hostUid } },
      { upsert: true, new: true }
    );
    const count = await Favorite.countDocuments({ memberUid: req.user.uid });
    return created(res, "Saved.", { hostUid, favorited: true, count });
  } catch (err) {
    // Concurrent add race → unique-index violation. Already saved, so success.
    if (err && err.code === 11000) {
      const count = await favoriteModel().countDocuments({ memberUid: req.user.uid });
      return success(res, "Already saved.", { hostUid: req.params.hostUid, favorited: true, count });
    }
    next(err);
  }
};

// ── DELETE /api/favorites/:hostUid ───────────────────────────────────────────
// Remove a saved host. Idempotent — deleting a missing row is a no-op 200.
exports.remove = async (req, res, next) => {
  try {
    const { hostUid } = req.params;
    const Favorite = favoriteModel();
    await Favorite.deleteOne({ memberUid: req.user.uid, hostUid });
    const count = await Favorite.countDocuments({ memberUid: req.user.uid });
    return success(res, "Removed.", { hostUid, favorited: false, count });
  } catch (err) {
    next(err);
  }
};
