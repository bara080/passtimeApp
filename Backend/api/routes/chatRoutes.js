const express = require("express");
const router = express.Router();

const {
  createChat,
  listMine,
  getChat,
  sendMessage,
  getMessages,
  markRead,
  clearForMe,
  closeChat,
} = require("../controllers/chat");
const verifyJWT = require("../middlewares/authMiddleware");
const { sendMessageLimiter } = require("../middlewares/rateLimiter");

router.get("/", verifyJWT, listMine);
router.post("/", verifyJWT, createChat);
router.get("/:chatId", verifyJWT, getChat);
router.post("/:chatId/message", verifyJWT, sendMessageLimiter, sendMessage);
router.get("/:chatId/messages", verifyJWT, getMessages);
router.post("/:chatId/read", verifyJWT, markRead);
router.post("/:chatId/clear", verifyJWT, clearForMe);
router.post("/:chatId/close", verifyJWT, closeChat);

module.exports = router;
