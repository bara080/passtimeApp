// Booking status lifecycle (booking.md §1). Transitions are the ONLY legal
// status changes — controllers must go through canTransition, never write
// `status` directly.

const TERMINAL = new Set([
  "declined",
  "expired_unpaid",
  "cancelled_member",
  "cancelled_host",
  "completed",
]);

// event → { from: allowed current statuses, to, actors: who may trigger }
const TRANSITIONS = {
  accept: { from: ["pending"], to: "accepted", actors: ["host"] },
  decline: { from: ["pending"], to: "declined", actors: ["host"] },
  cancel_member: { from: ["pending", "accepted"], to: "cancelled_member", actors: ["member"] },
  cancel_host: { from: ["accepted", "confirmed"], to: "cancelled_host", actors: ["host"] },
  pay_confirmed: { from: ["accepted"], to: "confirmed", actors: ["system"] }, // webhook only
  expire_unpaid: { from: ["accepted"], to: "expired_unpaid", actors: ["system"] },
  activate: { from: ["confirmed"], to: "active", actors: ["system"] },
  complete: { from: ["active"], to: "completed", actors: ["system", "host", "member"] },
};

/** Returns { ok: true, to } or { ok: false, message }. */
function canTransition(currentStatus, event, actor) {
  const t = TRANSITIONS[event];
  if (!t) return { ok: false, message: `Unknown booking event '${event}'.` };
  if (!t.actors.includes(actor)) {
    return { ok: false, message: `'${actor}' cannot perform '${event}'.` };
  }
  if (TERMINAL.has(currentStatus)) {
    return { ok: false, message: `Booking is already ${currentStatus}.` };
  }
  if (!t.from.includes(currentStatus)) {
    return { ok: false, message: `Cannot ${event} a booking that is ${currentStatus}.` };
  }
  return { ok: true, to: t.to };
}

function isTerminal(status) {
  return TERMINAL.has(status);
}

module.exports = { canTransition, isTerminal, TRANSITIONS, TERMINAL };
