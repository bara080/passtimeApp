const express = require("express");
const router = express.Router();
const { list, detail } = require("../controllers/payments");
const verifyJWT = require("../middlewares/authMiddleware");

router.get("/", verifyJWT, list);
router.get("/:paymentId", verifyJWT, detail);

module.exports = router;
