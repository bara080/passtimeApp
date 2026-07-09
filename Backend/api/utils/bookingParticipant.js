// Booking participant guard — the ONLY place controllers should ask
// "may this user act on this booking?". Keeps IDOR checks consistent.

/**
 * Returns { ok: true, role: "member"|"host" } when the authenticated user
 * is a party to the booking; { ok: false, message } otherwise.
 */
function assertParticipant(booking, uid, tokenRole) {
  if (!booking) return { ok: false, status: 404, message: "Booking not found." };
  if (booking.memberUid === uid) return { ok: true, role: "member" };
  if (booking.hostUid === uid) return { ok: true, role: "host" };
  // Do not disclose existence to non-participants.
  return { ok: false, status: 404, message: "Booking not found." };
}

/** Convenience: pick the actor label the state machine expects. */
function actorLabelFor(role) {
  return role === "host" ? "host" : "member";
}

module.exports = { assertParticipant, actorLabelFor };
