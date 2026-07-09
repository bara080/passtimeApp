// Conversation participant guard — the ONLY authoritative check for
// "may this uid act on this chat". Returns 404 (never 403) to non-participants
// so chat existence is never disclosed (mirrors bookingParticipant).

function assertChatParticipant(chat, uid) {
  if (!chat) return { ok: false, status: 404, message: "Chat not found." };
  if (chat.memberUid === uid) return { ok: true, role: "member" };
  if (chat.hostUid === uid) return { ok: true, role: "host" };
  return { ok: false, status: 404, message: "Chat not found." };
}

module.exports = { assertChatParticipant };
