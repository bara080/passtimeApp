const express = require("express");
const router = express.Router();
const { getStatus, submit, testReview } = require("../controllers/identity");
const verifyJWT = require("../middlewares/authMiddleware");

router.get("/", verifyJWT, getStatus);
router.post("/submit", verifyJWT, submit);
router.post("/_test_review", verifyJWT, testReview); // dev-only; 404 in production

module.exports = router;
