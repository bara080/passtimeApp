const { getConnection, getUserModel } = require("../config/db");
const { success, error } = require("../utils/responseFormatter");

const FEED_LIMIT = 100;

function getNotificationModel(role) {
  const conn = getConnection(role);
  return conn.model("Notification");
}

// ── GET /api/notifications ───────────────────────────────────────────────────
exports.list = async (req, res, next) => {
  try {
    const Notification = getNotificationModel(req.userRole);
    const items = await Notification.find({ uid: req.user.uid, role: req.userRole })
      .sort({ createdAt: -1 })
      .limit(FEED_LIMIT)
      .lean();
    const unreadCount = items.filter((n) => !n.isRead).length;
    return success(res, "OK", { notifications: items, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    const Notification = getNotificationModel(req.userRole);
    const result = await Notification.updateOne(
      { _id: req.params.id, uid: req.user.uid, role: req.userRole },
      { isRead: true }
    );
    if (result.matchedCount === 0) return error(res, 404, "Notification not found.");
    return success(res, "OK", {});
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
  try {
    const Notification = getNotificationModel(req.userRole);
    const result = await Notification.updateMany(
      { uid: req.user.uid, role: req.userRole, isRead: false },
      { isRead: true }
    );
    return success(res, "OK", { updated: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/clear-all ──────────────────────────────────────
exports.clearAll = async (req, res, next) => {
  try {
    const Notification = getNotificationModel(req.userRole);
    const result = await Notification.deleteMany({ uid: req.user.uid, role: req.userRole });
    return success(res, "OK", { deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/push-token ───────────────────────────────────────
// Register or refresh an Expo push token for the authenticated user's device.
// Dedupes at the token level so re-launching the same app does not duplicate.
exports.savePushToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (typeof token !== "string" || token.length < 10 || token.length > 512) {
      return error(res, 400, "token is required.");
    }
    if (platform !== undefined && !["ios", "android"].includes(platform)) {
      return error(res, 400, "platform must be 'ios' or 'android'.");
    }

    const UserModel = getUserModel(req.userRole);
    // Remove any existing entry with this token, then push a fresh timestamp.
    await UserModel.updateOne({ uid: req.user.uid }, { $pull: { expoPushTokens: { token } } });
    await UserModel.updateOne(
      { uid: req.user.uid },
      {
        $push: {
          expoPushTokens: {
            token,
            platform: platform || undefined,
            lastUpdated: new Date(),
          },
        },
      }
    );
    return success(res, "OK", { saved: true });
  } catch (err) {
    next(err);
  }
};
