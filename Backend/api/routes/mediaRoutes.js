const express = require("express");
const router = express.Router();
const { createUploadUrl, confirmUpload } = require("../controllers/media");
const verifyJWT = require("../middlewares/authMiddleware");
const { uploadUrlLimiter } = require("../middlewares/rateLimiter");

router.post("/upload-url", verifyJWT, uploadUrlLimiter, createUploadUrl);
router.post("/confirm", verifyJWT, confirmUpload);

module.exports = router;
