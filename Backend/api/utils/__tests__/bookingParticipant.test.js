const { assertParticipant } = require("../bookingParticipant");

const booking = { memberUid: "m1", hostUid: "h1", bookingId: "b" };

describe("assertParticipant", () => {
  test("member sees themselves", () => {
    expect(assertParticipant(booking, "m1", "member")).toEqual({ ok: true, role: "member" });
  });
  test("host sees themselves", () => {
    expect(assertParticipant(booking, "h1", "host")).toEqual({ ok: true, role: "host" });
  });
  test("outsider gets a 404, never a 403 (do not disclose existence)", () => {
    const r = assertParticipant(booking, "stranger", "member");
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
    expect(r.message).toMatch(/not found/i);
  });
  test("missing booking → 404", () => {
    const r = assertParticipant(null, "m1", "member");
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });
  test("participation is by uid, not by token role claim", () => {
    // A host uid presenting a member token still gets the host label — the
    // uid is the source of truth, not the claim.
    expect(assertParticipant(booking, "h1", "member")).toEqual({ ok: true, role: "host" });
  });
});
