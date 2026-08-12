const express = require("express");
const router = express.Router();

const {
  getSlots,
  createBooking,
  listMine,
  getBooking,
  accept,
  decline,
  cancel,
  pay,
  testConfirm,
} = require("../controllers/booking");
const verifyJWT = require("../middlewares/authMiddleware");
const { createBookingLimiter } = require("../middlewares/rateLimiter");
// Idempotency middleware — replays 2xx responses for identical Idempotency-Key
// headers within TTL. Optional per-route (required:false) so unshipped client
// versions keep working. Flip required:true once the frontend interceptor is
// live on all supported binaries. See logout-idempotency.md.
const { requireIdempotencyKey } = require("../middlewares/idempotency");

router.get("/slots", verifyJWT, getSlots);
router.get("/mine", verifyJWT, listMine);
// old: router.post("/", verifyJWT, createBookingLimiter, createBooking);
router.post(
  "/",
  verifyJWT,
  createBookingLimiter,
  requireIdempotencyKey({ scope: "booking-create", ttl: 60 }),
  createBooking
);
router.get("/:id", verifyJWT, getBooking);
// P2 cosmetic: accept/decline/cancel benefit from idempotent replay too, so a
// double-tap returns the same 200 instead of a state-machine 409.
// old: router.post("/:id/accept", verifyJWT, accept);
router.post("/:id/accept", verifyJWT, requireIdempotencyKey({ scope: "booking-accept", ttl: 60 }), accept);
// old: router.post("/:id/decline", verifyJWT, decline);
router.post("/:id/decline", verifyJWT, requireIdempotencyKey({ scope: "booking-decline", ttl: 60 }), decline);
// old: router.post("/:id/cancel", verifyJWT, cancel);
router.post("/:id/cancel", verifyJWT, requireIdempotencyKey({ scope: "booking-cancel", ttl: 60 }), cancel);
// old: router.post("/:id/pay", verifyJWT, pay);
router.post("/:id/pay", verifyJWT, requireIdempotencyKey({ scope: "booking-pay", ttl: 60 }), pay);
router.post("/:id/_test_confirm", verifyJWT, testConfirm);

module.exports = router;
