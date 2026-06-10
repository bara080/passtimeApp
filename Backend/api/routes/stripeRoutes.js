const express = require("express");
const router = express.Router();
const verifyJWT = require("../middlewares/authMiddleware");
const {
  createConnectAccount,
  getConnectAccountStatus,
  createPaymentIntent,
  isPayoutReady,
  startPayoutOnboarding,
} = require("../controllers/stripe");
const { handleStripeWebhook } = require("../controllers/stripeWebhook");

// Webhook — must use raw body (mounted before json middleware in app.js)
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// Host Connect onboarding
router.post("/connect/onboard", verifyJWT, createConnectAccount);
router.get("/connect/status/:accountId", getConnectAccountStatus);
router.get("/connect/payout-ready", verifyJWT, isPayoutReady);
router.post("/connect/onboarding-link", verifyJWT, startPayoutOnboarding);

// Member payments
router.post("/payment-intent", verifyJWT, createPaymentIntent);

module.exports = router;
