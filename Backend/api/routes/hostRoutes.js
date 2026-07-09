const express = require("express");
const router = express.Router();

const { updateOnboarding, updateAvailability } = require("../controllers/host");
const verifyJWT = require("../middlewares/authMiddleware");

router.patch("/onboarding", verifyJWT, updateOnboarding);
router.put("/availability", verifyJWT, updateAvailability);

module.exports = router;
