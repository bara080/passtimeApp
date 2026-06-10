const { getRedis } = require("../config/redis");

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const sessionKeys = {
  session: (sessionId) => `sess:${sessionId}`,
  userSessions: (uid) => `user:sessions:${uid}`,
};

async function createSession({ sessionId, uid, role, deviceInfo }) {
  const redis = getRedis();
  const payload = {
    uid,
    role,
    deviceInfo: deviceInfo || "Unknown device",
    createdAt: new Date().toISOString(),
  };

  await redis
    .multi()
    .set(sessionKeys.session(sessionId), JSON.stringify(payload), {
      EX: SESSION_TTL_SECONDS,
    })
    .sAdd(sessionKeys.userSessions(uid), sessionId)
    .expire(sessionKeys.userSessions(uid), SESSION_TTL_SECONDS)
    .exec();

  return payload;
}

async function getSession(sessionId) {
  const redis = getRedis();
  const raw = await redis.get(sessionKeys.session(sessionId));
  return raw ? JSON.parse(raw) : null;
}

async function updateSession(sessionId, patch) {
  const redis = getRedis();
  const current = await getSession(sessionId);
  if (!current) return null;

  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await redis.set(sessionKeys.session(sessionId), JSON.stringify(next), { KEEPTTL: true });
  return next;
}

async function deleteSession({ uid, sessionId }) {
  const redis = getRedis();
  await redis
    .multi()
    .del(sessionKeys.session(sessionId))
    .sRem(sessionKeys.userSessions(uid), sessionId)
    .exec();
}

async function deleteAllUserSessions(uid) {
  const redis = getRedis();
  const sessionIds = await redis.sMembers(sessionKeys.userSessions(uid));
  if (!sessionIds.length) return;

  const pipeline = redis.multi();
  for (const sessionId of sessionIds) {
    pipeline.del(sessionKeys.session(sessionId));
  }
  pipeline.del(sessionKeys.userSessions(uid));
  await pipeline.exec();
}

module.exports = {
  SESSION_TTL_SECONDS,
  sessionKeys,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  deleteAllUserSessions,
};
