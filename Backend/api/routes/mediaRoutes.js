const express = require("express");
const router = express.Router();
const { createUploadUrl, confirmUpload } = require("../controllers/media");
const verifyJWT = require("../middlewares/authMiddleware");

router.post("/upload-url", verifyJWT, createUploadUrl);
router.post("/confirm", verifyJWT, confirmUpload);

module.exports = router;
