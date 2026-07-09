// Central notification dispatcher — the ONLY place other code publishes events.
// Fans out to (1) Mongo feed and (2) Expo push. Realtime RTDB mirror is a
// slice-2 addition (arrives with chat; needs no code change here — a mirror
// hook can subscribe to the feed writes).
//
// Design principles (notificationArchitecture.md, ported from Zinga):
//   • Idempotent when `key` is supplied — dup writes hit the partial unique
//     index and no-op quietly.
//   • Never throws to the caller — a tracker/push outage must not fail a
//     booking transition. Errors are logged.
//   • Push suppresses "self-notifications": if `actorUid === recipientUid`,
//     the payload still goes to the feed but not to the device banner
//     (avoids spam from an action the user just performed).

const { getConnection, getUserModel } = require("../config/db");

// expo-server-sdk v6 ships ESM-only, which breaks require() on Vercel's CJS
// runtime. Lazy-load via dynamic import and cache the module + instance so the
// first push pays a one-time hit and subsequent calls stay hot.
let _expoModPromise = null;
async function getExpoMod() {
  if (!_expoModPromise) _expoModPromise = import("expo-server-sdk");
  return _expoModPromise;
}
let _expoInstance = null;
async function getExpo() {
  if (_expoInstance) return _expoInstance;
  const mod = await getExpoMod();
  const Expo = mod.Expo || mod.default?.Expo || mod.default;
  _expoInstance = new Expo();
  return _expoInstance;
}
async function isExpoPushToken(token) {
  const mod = await getExpoMod();
  const Expo = mod.Expo || mod.default?.Expo || mod.default;
  return Expo.isExpoPushToken(token);
}

function logline(level, event, meta = {}) {
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta })
  );
}

async function writeFeed({ uid, role, title, body, type, data, key }) {
  const conn = getConnection(role);
  if (!conn) throw new Error(`No DB connection for role ${role}`);
  const Notification = conn.model("Notification");
  try {
    const doc = await Notification.create({ uid, role, title, body, type, data, key });
    return doc;
  } catch (err) {
    // Duplicate-key on the (uid, role, key) partial index → idempotent no-op.
    if (err && err.code === 11000) {
      logline("log", "notification.dedupe.skip", { uid, role, type, key });
      return null;
    }
    throw err;
  }
}

async function sendPush({ recipientUid, role, title, body, data, suppressForActor }) {
  if (suppressForActor && suppressForActor === recipientUid) return { skipped: "self" };
  const UserModel = getUserModel(role);
  const user = await UserModel.findOne({ uid: recipientUid }).select("expoPushTokens pushToken");
  const tokens = new Set();
  for (const entry of user?.expoPushTokens || []) {
    if (entry?.token && (await isExpoPushToken(entry.token))) tokens.add(entry.token);
  }
  // Fall back to the legacy single-field token so today's binaries keep receiving push.
  if (user?.pushToken && (await isExpoPushToken(user.pushToken))) tokens.add(user.pushToken);
  if (tokens.size === 0) return { skipped: "no-tokens" };

  const messages = [...tokens].map((to) => ({
    to,
    title,
    body,
    sound: "default",
    data: data || {},
  }));
  const expo = await getExpo();
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    } catch (err) {
      logline("error", "push.chunk.failed", { message: err.message });
    }
  }
  return { sent: tickets.length };
}

/**
 * Publish a notification.
 * @param {object} args
 * @param {string} args.uid       recipient uid
 * @param {"member"|"host"} args.role recipient role/cluster
 * @param {string} args.title
 * @param {string} args.body
 * @param {string} args.type      notification type enum
 * @param {object} [args.data]    deep-link routing hints (e.g. {bookingId})
 * @param {string} [args.key]     idempotency key
 * @param {"inapp"|"push"|"both"} [args.channel]  default "both"
 * @param {string} [args.actorUid] uid of whoever performed the triggering action
 *                                  (suppresses push to self)
 */
async function notifyUser(args) {
  const { uid, role, title, body, type, data, key, channel = "both", actorUid } = args;
  if (!uid || !role || !title || !body || !type) {
    throw new Error("notifyUser requires uid, role, title, body, type.");
  }

  const results = { feed: null, push: null };

  if (channel === "inapp" || channel === "both") {
    try {
      results.feed = await writeFeed({ uid, role, title, body, type, data, key });
    } catch (err) {
      logline("error", "notification.feed.failed", { uid, role, type, message: err.message });
    }
  }

  if (channel === "push" || channel === "both") {
    try {
      results.push = await sendPush({
        recipientUid: uid,
        role,
        title,
        body,
        data: { type, ...(data || {}) },
        suppressForActor: actorUid,
      });
    } catch (err) {
      logline("error", "notification.push.failed", { uid, role, type, message: err.message });
    }
  }

  logline("log", "notification.dispatched", { uid, role, type, channel, key, actorUid });
  return results;
}

module.exports = { notifyUser };
