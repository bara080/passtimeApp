const jwt = require("jsonwebtoken");

exports.generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });

exports.generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  });

exports.verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

exports.verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

exports.parseDuration = (durationStr) => {
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) throw new Error("Invalid duration string");
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(value) * multipliers[unit];
};

exports.getRefreshExpiryDate = () => {
  const durationMs = exports.parseDuration(
    process.env.REFRESH_TOKEN_EXPIRES_IN || "30d"
  );
  return new Date(Date.now() + durationMs);
};
