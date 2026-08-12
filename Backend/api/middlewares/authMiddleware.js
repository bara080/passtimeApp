const jwt = require("jsonwebtoken");
const { error } = require("../utils/responseFormatter");
const { getSession } = require("../utils/redisSession");
const { isRedisReady } = require("../config/redis");
const { getUserModel } = require("../config/db");

const ALLOWED_ROLES = ["member", "host"];

function normalizeRole(r) {
  if (typeof r !== "string") return null;
  const s = r.toLowerCase().trim();
  return ALLOWED_ROLES.includes(s) ? s : null;
}

/**
 * Factory that returns a JWT verifier.
 * @param {object}  [opts]
 * @param {boolean} [opts.allowMissingSession=false]  When true, a valid JWT
 *   whose session is no longer in Redis is treated as authenticated (used by
 *   /logout so retries after a successful revoke still get 200 instead of a
 *   401 cascade). See logout-idempotency.md.
 */
function buildVerifier({ allowMissingSession = false } = {}) {
  return async function verify(req, res, next) {
    return runVerify(req, res, next, { allowMissingSession });
  };
}

const verifyJWT = async (req, res, next) => {
  return runVerify(req, res, next, { allowMissingSession: false });
};

async function runVerify(req, res, next, { allowMissingSession }) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, 401, "Unauthorized. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const uid = decoded.uid ? String(decoded.uid).trim() : "";
    const { sessionId } = decoded;

    if (!uid) return error(res, 401, "Unauthorized. Missing uid in token.");
    if (!sessionId) return error(res, 401, "Unauthorized. Missing sessionId in token.");

    // Redis holds the source of truth for session validity. On cold starts
    // Redis takes ~4s to warm — blocking here would balloon p99 for every
    // authed route. When Redis isn't ready, trust the JWT (still signed,
    // still short-lived, ~15min TTL) and log a warning so we can spot
    // extended outages in Sentry. Sessions revoked via /logout will start
    // being enforced again the moment Redis reconnects.
    let session = null;
    if (isRedisReady()) {
      session = await getSession(sessionId);
      if (!session) {
        // allowMissingSession is opt-in per-route (currently only /logout).
        // JWT signature already proved authorship; the session lookup just
        // confirms it hasn't been revoked. For a logout retry we don't care.
        if (!allowMissingSession) return error(res, 401, "Session expired or revoked.");
      } else if (String(session.uid ?? "").trim() !== uid) {
        return error(res, 401, "Invalid session.");
      }
    } else {
      console.warn(`⚠️ auth: Redis unavailable — JWT-only trust for uid=${uid}`);
    }

    const role = normalizeRole(decoded.role) || (session ? normalizeRole(session.role) : null);
    if (!role) return error(res, 401, "Unauthorized. Missing role in token.");

    const UserModel = getUserModel(role);
    const user = await UserModel.findOne({ uid });
    if (!user) return error(res, 404, "User not found.");

    if (!user.isActive) return error(res, 403, "Account is deactivated.");

    req.user = user;
    req.userRole = role;
    req.sessionId = sessionId;
    req.session = session; // null when Redis is degraded — controllers must not rely on it

    next();
  } catch (err) {
    console.error("❌ JWT error:", err.message);
    return error(res, 401, "Invalid or expired token.");
  }
};

// Default export stays a plain middleware for backwards-compat with existing
// `require("../middlewares/authMiddleware")` usage. New named exports let
// specific routes opt into softer behavior (logout).
module.exports = verifyJWT;
module.exports.verifyJWT = verifyJWT;
module.exports.buildVerifier = buildVerifier;
