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

router.get("/slots", verifyJWT, getSlots);
router.get("/mine", verifyJWT, listMine);
router.post("/", verifyJWT, createBookingLimiter, createBooking);
router.get("/:id", verifyJWT, getBooking);
router.post("/:id/accept", verifyJWT, accept);
router.post("/:id/decline", verifyJWT, decline);
router.post("/:id/cancel", verifyJWT, cancel);
router.post("/:id/pay", verifyJWT, pay);
router.post("/:id/_test_confirm", verifyJWT, testConfirm);

module.exports = router;
