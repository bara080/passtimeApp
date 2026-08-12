const { v4: uuidv4 } = require("uuid");
const admin = require("../config/firebase");
const { getConnection } = require("../config/db");
const { success, created, error } = require("../utils/responseFormatter");
const { assertChatParticipant } = require("../utils/chatParticipant");
const { notifyUser } = require("../utils/notifyUser");

const { getRedis, isRedisReady } = require("../config/redis");

const MESSAGE_MAX = 1000;
const HISTORY_LIMIT = 200;

// Server-side dedupe window for messages. Client generates a deterministic
// `${uid}_${ts}` messageId; if it retries within this window we short-circuit
// and don't refire the push notification. See logout-idempotency.md P1#2.
// FOLLOW-UP: move to Redis SETNX for stricter "first writer wins" semantics
// under concurrent retries; current GET/SET is best-effort dedup.
const MESSAGE_DEDUP_SECONDS = 30;

/** RTDB reference for a chat, or null when the database URL isn't configured. */
function rtdbChat(chatId) {
  try {
    if (!process.env.FIREBASE_DB_URL) return null;
    return admin.database().ref(`chats/${chatId}`);
  } catch (err) {
    console.error("[chat] rtdb ref failed:", err.message);
    return null;
  }
}

function models() {
  const conn = getConnection("member");
  return {
    Conversation: conn.model("Conversation"),
    Booking: conn.model("Booking"),
  };
}

/** Fire-and-forget push. */
function fireNotify(payload) {
  notifyUser(payload).catch((err) => console.error("[chat] notify failed:", err.message));
}

// ── POST /api/chats ──────────────────────────────────────────────────────────
// Create the conversation for a confirmed booking. Idempotent on bookingId —
// two requests for the same booking return the SAME chat (chat.md §3).
exports.createChat = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (typeof bookingId !== "string" || !bookingId) return error(res, 400, "bookingId is required.");

    const { Conversation, Booking } = models();
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return error(res, 404, "Booking not found.");

    // Only the two parties may open the chat.
    if (booking.memberUid !== req.user.uid && booking.hostUid !== req.user.uid) {
      return error(res, 404, "Booking not found.");
    }
    // Chat is booking-gated: must be past the request stage.
    if (!["confirmed", "active", "completed"].includes(booking.status)) {
      return error(res, 409, "Chat unlocks once the booking is confirmed.");
    }

    const existing = await Conversation.findOne({ bookingId });
    if (existing) return success(res, "OK", { chat: existing.toObject() });

    const chat = await Conversation.create({
      chatId: uuidv4(),
      bookingId,
      memberUid: booking.memberUid,
      hostUid: booking.hostUid,
      status: "open",
    });

    // Seed RTDB meta node so security rules can gate reads by participant.
    try {
      const ref = rtdbChat(chat.chatId);
      if (ref) {
        await ref.child("meta").set({
          chatId: chat.chatId,
          bookingId: chat.bookingId,
          memberUid: chat.memberUid,
          hostUid: chat.hostUid,
          status: "open",
        });
      }
    } catch (err) {
      console.error("[chat.create] rtdb seed failed:", err.message);
    }

    return created(res, "Chat created.", { chat: chat.toObject() });
  } catch (err) {
    if (err && err.code === 11000) {
      // race — another request created it a moment ago; fetch and return.
      try {
        const { Conversation } = models();
        const chat = await Conversation.findOne({ bookingId: req.body.bookingId });
        if (chat) return success(res, "OK", { chat: chat.toObject() });
      } catch { /* fall through */ }
    }
    next(err);
  }
};

// ── GET /api/chats ───────────────────────────────────────────────────────────
exports.listMine = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const scope = req.userRole === "host"
      ? { hostUid: req.user.uid }
      : { memberUid: req.user.uid };

    const chats = await Conversation.find(scope)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(50)
      .lean();

    // Compute unread per chat for the viewer.
    const decorated = chats.map((c) => {
      const roleKey = c.memberUid === req.user.uid ? "member" : "host";
      const lastRead = c.lastReadAt?.[roleKey];
      const unread = c.lastMessageAt && (!lastRead || new Date(c.lastMessageAt) > new Date(lastRead));
      return { ...c, viewerRole: roleKey, unread: Boolean(unread) };
    });

    const unreadCount = decorated.filter((c) => c.unread).length;
    return success(res, "OK", { chats: decorated, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/chats/:chatId ───────────────────────────────────────────────────
exports.getChat = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);

    // Fresh counterparty profiles — booking-time snapshots go stale when a
    // user renames themselves post-booking (chat.md §5b, openIssues.md #8).
    const { getUserModel } = require("../config/db");
    const [member, host] = await Promise.all([
      getUserModel("member").findOne({ uid: chat.memberUid }).select("uid displayName firstName lastName avatarUrl professionalRole").lean(),
      getUserModel("host").findOne({ uid: chat.hostUid }).select("uid displayName firstName lastName avatarUrl professionalRole").lean(),
    ]);
    const profile = (u) =>
      u
        ? {
            uid: u.uid,
            displayName: u.displayName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null,
            avatarUrl: u.avatarUrl || null,
            professionalRole: u.professionalRole || null,
          }
        : null;

    return success(res, "OK", {
      chat: chat.toObject(),
      viewerRole: gate.role,
      memberProfile: profile(member),
      hostProfile: profile(host),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/chats/:chatId/message ──────────────────────────────────────────
// Validates, updates Mongo metadata, writes the body to RTDB under
// /chats/{chatId}/messages, and fires a push notification. Message IDs are
// deterministic (`${senderUid}_${timestamp}`) so the client's optimistic-UI
// entry dedupes cleanly when the listener fires (Zinga pattern).
exports.sendMessage = async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (text.length === 0 || text.length > MESSAGE_MAX) {
      return error(res, 400, `text must be 1-${MESSAGE_MAX} chars.`);
    }

    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);
    if (chat.status !== "open") return error(res, 409, "This chat is closed.");

    const now = new Date();
    const timestamp = now.getTime();
    // Accept a client-supplied messageId so retries collapse to one write.
    // The client already generates `${uid}_${originalTs}` for optimistic UI;
    // sending it along makes the server dedup on the exact same key. If the
    // client doesn't send one we fall back to the server timestamp — safe but
    // won't dedup across retries. FOLLOW-UP: make body.messageId required.
    const clientMessageId = typeof req.body?.messageId === "string" ? req.body.messageId.trim() : "";
    const messageId = clientMessageId && /^[A-Za-z0-9_-]{6,128}$/.test(clientMessageId)
      ? clientMessageId
      : `${req.user.uid}_${timestamp}`;

    // Short-circuit on replay — same messageId inside the dedup window means
    // the RTDB write and the push notification already went out. Return the
    // same success shape so the client's optimistic UI stays consistent.
    if (isRedisReady()) {
      const dedupKey = `msg:sent:${chat.chatId}:${messageId}`;
      try {
        const cached = await getRedis().get(dedupKey);
        if (cached) {
          return success(res, "OK", { chat: chat.toObject(), messageId, replay: true });
        }
        await getRedis().set(dedupKey, "1", { EX: MESSAGE_DEDUP_SECONDS });
      } catch (redisErr) {
        console.warn("[chat.send] dedup cache failed:", redisErr.message);
      }
    }
    const senderName =
      gate.role === "member"
        ? req.user.displayName || req.user.firstName || "Member"
        : req.user.displayName || req.user.firstName || "Host";

    // Live message body → RTDB. Fire-and-forget: metadata + notification still
    // succeed if RTDB is temporarily unavailable so the client's next fetch is
    // consistent with what the listener will see.
    try {
      const ref = rtdbChat(chat.chatId);
      if (ref) {
        await ref.child(`messages/${messageId}`).set({
          sender: req.user.uid,
          senderRole: gate.role,
          senderName,
          text,
          timestamp,
        });
        await ref.child("meta").update({ lastMessage: text.slice(0, 120), lastMessageAt: timestamp });
      }
    } catch (err) {
      console.error("[chat.send] rtdb write failed:", err.message);
    }

    chat.lastMessage = text.slice(0, 120);
    chat.lastMessageAt = now;
    // Auto-mark the sender's side as read — they just wrote it.
    if (gate.role === "member") chat.lastReadAt.member = now;
    else chat.lastReadAt.host = now;
    await chat.save();

    // Notify the other party (chat.md §5, closes Zinga's 'no push on message' gap).
    // channel: "push" ONLY — chat messages live in the Messages tab, not the
    // notifications feed. Prevents the notifications inbox from filling up
    // with every single message; the unread badge on Messages already conveys
    // count. Booking events (accept/decline/cancel/etc.) still write to both.
    const otherUid = gate.role === "member" ? chat.hostUid : chat.memberUid;
    const otherRole = gate.role === "member" ? "host" : "member";
    fireNotify({
      uid: otherUid,
      role: otherRole,
      title: "New message",
      body: text.slice(0, 120),
      type: "chat_message",
      data: { chatId: chat.chatId, bookingId: chat.bookingId },
      actorUid: req.user.uid,
      channel: "push",
    });

    return success(res, "OK", { chat: chat.toObject(), messageId });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/chats/:chatId/messages ──────────────────────────────────────────
// Fallback message-history endpoint. In production the client should subscribe
// to RTDB directly for live updates; this route is here for cold-start hydration
// and for clients that can't init the JS SDK. Returns the most recent
// HISTORY_LIMIT messages, oldest-first.
exports.getMessages = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);

    // Skip messages cleared by this user (per-user soft clear).
    const clearedAt = chat.clearedAtBy?.[req.user.uid]
      ? new Date(chat.clearedAtBy[req.user.uid]).getTime()
      : 0;

    const ref = rtdbChat(chat.chatId);
    if (!ref) return success(res, "OK", { messages: [] });

    const snap = await ref.child("messages").limitToLast(HISTORY_LIMIT).once("value");
    const raw = snap.val() || {};
    const messages = Object.entries(raw)
      .map(([id, m]) => ({ id, ...m }))
      .filter((m) => (typeof m.timestamp === "number" ? m.timestamp > clearedAt : true))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    return success(res, "OK", { messages });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/chats/:chatId/read ─────────────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);
    const key = gate.role === "member" ? "lastReadAt.member" : "lastReadAt.host";
    await Conversation.updateOne({ chatId: chat.chatId }, { [key]: new Date() });
    return success(res, "OK", {});
  } catch (err) {
    next(err);
  }
};

// ── POST /api/chats/:chatId/clear ────────────────────────────────────────────
exports.clearForMe = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);
    const clearedAtBy = { ...(chat.clearedAtBy || {}), [req.user.uid]: new Date() };
    await Conversation.updateOne({ chatId: chat.chatId }, { clearedAtBy });
    return success(res, "OK", {});
  } catch (err) {
    next(err);
  }
};

// ── POST /api/chats/:chatId/close ────────────────────────────────────────────
// Either party can close a conversation (Zinga pattern). No re-open in v1.
exports.closeChat = async (req, res, next) => {
  try {
    const { Conversation } = models();
    const chat = await Conversation.findOne({ chatId: req.params.chatId });
    const gate = assertChatParticipant(chat, req.user.uid);
    if (!gate.ok) return error(res, gate.status, gate.message);
    if (chat.status === "closed") return success(res, "OK", { chat: chat.toObject() });
    chat.status = "closed";
    await chat.save();
    return success(res, "OK", { chat: chat.toObject() });
  } catch (err) {
    next(err);
  }
};
