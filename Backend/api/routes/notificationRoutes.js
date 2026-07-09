const express = require("express");
const router = express.Router();

const { list, markRead, markAllRead, clearAll, savePushToken } = require("../controllers/notifications");
const verifyJWT = require("../middlewares/authMiddleware");

router.get("/", verifyJWT, list);
router.patch("/read-all", verifyJWT, markAllRead);
router.delete("/clear-all", verifyJWT, clearAll);
router.patch("/:id/read", verifyJWT, markRead);
router.post("/push-token", verifyJWT, savePushToken);

module.exports = router;
