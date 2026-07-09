const express = require("express");
const router = express.Router();

const { updateOnboarding, updateAvailability, discoverHosts, getDashboard } = require("../controllers/host");
const verifyJWT = require("../middlewares/authMiddleware");

router.patch("/onboarding", verifyJWT, updateOnboarding);
router.put("/availability", verifyJWT, updateAvailability);
router.get("/discover", verifyJWT, discoverHosts);
router.get("/dashboard", verifyJWT, getDashboard);

module.exports = router;
