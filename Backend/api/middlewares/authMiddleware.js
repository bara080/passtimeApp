const jwt = require("jsonwebtoken");
const { error } = require("../utils/responseFormatter");
const { getSession } = require("../utils/redisSession");
const { getUserModel } = require("../config/db");

const ALLOWED_ROLES = ["member", "host"];

function normalizeRole(r) {
  if (typeof r !== "string") return null;
  const s = r.toLowerCase().trim();
  return ALLOWED_ROLES.includes(s) ? s : null;
}

const verifyJWT = async (req, res, next) => {
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

    // Redis is the source of truth for session validity
    const session = await getSession(sessionId);
    if (!session) return error(res, 401, "Session expired or revoked.");
    if (String(session.uid ?? "").trim() !== uid) return error(res, 401, "Invalid session.");

    const role = normalizeRole(decoded.role) || normalizeRole(session.role);
    if (!role) return error(res, 401, "Unauthorized. Missing role in token.");

    const UserModel = getUserModel(role);
    const user = await UserModel.findOne({ uid });
    if (!user) return error(res, 404, "User not found.");

    if (!user.isActive) return error(res, 403, "Account is deactivated.");

    req.user = user;
    req.userRole = role;
    req.sessionId = sessionId;
    req.session = session;

    next();
  } catch (err) {
    console.error("❌ JWT error:", err.message);
    return error(res, 401, "Invalid or expired token.");
  }
};

module.exports = verifyJWT;
