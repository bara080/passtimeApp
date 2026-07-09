const { canTransition, isTerminal, TRANSITIONS } = require("../bookingStateMachine");

describe("canTransition — happy paths", () => {
  test.each([
    ["pending", "accept", "host", "accepted"],
    ["pending", "decline", "host", "declined"],
    ["pending", "cancel_member", "member", "cancelled_member"],
    ["accepted", "cancel_member", "member", "cancelled_member"],
    ["accepted", "cancel_host", "host", "cancelled_host"],
    ["accepted", "pay_confirmed", "system", "confirmed"],
    ["accepted", "expire_unpaid", "system", "expired_unpaid"],
    ["confirmed", "cancel_host", "host", "cancelled_host"],
    ["confirmed", "activate", "system", "active"],
    ["active", "complete", "host", "completed"],
    ["active", "complete", "system", "completed"],
  ])("%s + %s (%s) -> %s", (from, event, actor, to) => {
    const r = canTransition(from, event, actor);
    expect(r.ok).toBe(true);
    expect(r.to).toBe(to);
  });
});

describe("canTransition — wrong actor", () => {
  test("member cannot accept", () => {
    const r = canTransition("pending", "accept", "member");
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/cannot perform/);
  });
  test("host cannot cancel as member", () => {
    expect(canTransition("pending", "cancel_member", "host").ok).toBe(false);
  });
  test("member cannot mark payment confirmed (system-only)", () => {
    expect(canTransition("accepted", "pay_confirmed", "member").ok).toBe(false);
  });
});

describe("canTransition — wrong source status", () => {
  test("cannot accept a confirmed booking", () => {
    const r = canTransition("confirmed", "accept", "host");
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/confirmed/);
  });
  test("cannot pay for a pending booking (must accept first)", () => {
    expect(canTransition("pending", "pay_confirmed", "system").ok).toBe(false);
  });
  test("cannot activate an unpaid accepted booking", () => {
    expect(canTransition("accepted", "activate", "system").ok).toBe(false);
  });
});

describe("terminal statuses reject every transition", () => {
  const terminals = ["declined", "expired_unpaid", "cancelled_member", "cancelled_host", "completed"];
  const events = Object.keys(TRANSITIONS);
  test.each(terminals.flatMap((s) => events.map((e) => [s, e])))("%s cannot %s", (from, event) => {
    const actor = TRANSITIONS[event].actors[0];
    const r = canTransition(from, event, actor);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/already/);
  });
  test("isTerminal recognises every terminal state", () => {
    for (const s of terminals) expect(isTerminal(s)).toBe(true);
    for (const s of ["pending", "accepted", "confirmed", "active"]) expect(isTerminal(s)).toBe(false);
  });
});

describe("canTransition — unknown event", () => {
  test("returns a helpful message", () => {
    const r = canTransition("pending", "teleport", "host");
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Unknown/);
  });
});
