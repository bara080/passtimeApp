const { assertChatParticipant } = require("../chatParticipant");

const chat = { chatId: "c1", memberUid: "m1", hostUid: "h1" };

describe("assertChatParticipant", () => {
  test("member matches by uid", () => {
    expect(assertChatParticipant(chat, "m1")).toEqual({ ok: true, role: "member" });
  });
  test("host matches by uid", () => {
    expect(assertChatParticipant(chat, "h1")).toEqual({ ok: true, role: "host" });
  });
  test("outsider gets 404 (never 403)", () => {
    const r = assertChatParticipant(chat, "stranger");
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });
  test("missing chat → 404", () => {
    expect(assertChatParticipant(null, "m1").status).toBe(404);
  });
});
