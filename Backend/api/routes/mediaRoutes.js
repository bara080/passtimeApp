const express = require("express");
const router = express.Router();
const { createUploadUrl, confirmUpload } = require("../controllers/media");
const verifyJWT = require("../middlewares/authMiddleware");
const { uploadUrlLimiter } = require("../middlewares/rateLimiter");
// Signed-URL mints are metered; dedupe a double-tap/retry burst so we don't
// burn quota on identical requests. See logout-idempotency.md ("media key").
const { requireIdempotencyKey } = require("../middlewares/idempotency");

// old: router.post("/upload-url", verifyJWT, uploadUrlLimiter, createUploadUrl);
router.post(
  "/upload-url",
  verifyJWT,
  uploadUrlLimiter,
  requireIdempotencyKey({ scope: "media-upload-url", ttl: 60 }),
  createUploadUrl
);
router.post("/confirm", verifyJWT, confirmUpload);

module.exports = router;
