// Unit-test the dispatcher's routing logic with in-memory mocks so we don't
// need Mongo/Expo to run. Integration coverage comes from the live E2E next.

jest.mock("../../config/db", () => {
  const feed = [];
  const users = new Map();
  return {
    __feed: feed,
    __users: users,
    getConnection: (role) => ({
      model: () => ({
        create: async (doc) => {
          // simulate the unique (uid, role, key) partial index
          if (doc.key && feed.some((x) => x.uid === doc.uid && x.role === doc.role && x.key === doc.key)) {
            const err = new Error("dup");
            err.code = 11000;
            throw err;
          }
          const saved = { ...doc, _id: `nid-${feed.length}` };
          feed.push(saved);
          return saved;
        },
      }),
    }),
    getUserModel: (role) => ({
      findOne: () => ({
        select: async () => users.get("recipient") ?? null,
      }),
    }),
  };
});

jest.mock("expo-server-sdk", () => {
  const sent = [];
  class Expo {
    static isExpoPushToken(t) {
      return typeof t === "string" && t.startsWith("ExponentPushToken[");
    }
    chunkPushNotifications(messages) {
      return [messages];
    }
    async sendPushNotificationsAsync(chunk) {
      sent.push(...chunk);
      return chunk.map(() => ({ status: "ok" }));
    }
  }
  Expo.__sent = sent;
  return { Expo };
});

const db = require("../../config/db");
const { Expo } = require("expo-server-sdk");
const { notifyUser } = require("../notifyUser");

beforeEach(() => {
  db.__feed.length = 0;
  db.__users.clear();
  Expo.__sent.length = 0;
});

const BASE = {
  uid: "u1",
  role: "member",
  title: "Hello",
  body: "world",
  type: "general",
};

describe("notifyUser", () => {
  test("writes feed and skips push when the user has no tokens", async () => {
    const r = await notifyUser(BASE);
    expect(db.__feed.length).toBe(1);
    expect(db.__feed[0].title).toBe("Hello");
    expect(r.push).toEqual({ skipped: "no-tokens" });
  });

  test("sends push to every registered token (expoPushTokens[] + legacy pushToken)", async () => {
    db.__users.set("recipient", {
      expoPushTokens: [{ token: "ExponentPushToken[abc]" }],
      pushToken: "ExponentPushToken[legacy]",
    });
    await notifyUser(BASE);
    expect(Expo.__sent.map((m) => m.to).sort()).toEqual(["ExponentPushToken[abc]", "ExponentPushToken[legacy]"]);
  });

  test("suppresses push when actor is the recipient (feed still written)", async () => {
    db.__users.set("recipient", { expoPushTokens: [{ token: "ExponentPushToken[abc]" }] });
    const r = await notifyUser({ ...BASE, actorUid: "u1" });
    expect(r.push).toEqual({ skipped: "self" });
    expect(db.__feed.length).toBe(1);
    expect(Expo.__sent.length).toBe(0);
  });

  test("idempotent when key repeats — second call is a no-op on the feed", async () => {
    await notifyUser({ ...BASE, key: "booking_reminder:b1:20m" });
    await notifyUser({ ...BASE, key: "booking_reminder:b1:20m" });
    expect(db.__feed.length).toBe(1);
  });

  test("channel: inapp skips push entirely", async () => {
    db.__users.set("recipient", { expoPushTokens: [{ token: "ExponentPushToken[abc]" }] });
    const r = await notifyUser({ ...BASE, channel: "inapp" });
    expect(db.__feed.length).toBe(1);
    expect(r.push).toBeNull();
    expect(Expo.__sent.length).toBe(0);
  });

  test("channel: push skips the feed entirely", async () => {
    db.__users.set("recipient", { expoPushTokens: [{ token: "ExponentPushToken[abc]" }] });
    const r = await notifyUser({ ...BASE, channel: "push" });
    expect(db.__feed.length).toBe(0);
    expect(r.feed).toBeNull();
    expect(Expo.__sent.length).toBe(1);
  });

  test("invalid tokens are filtered before send", async () => {
    db.__users.set("recipient", {
      expoPushTokens: [{ token: "not-a-real-token" }, { token: "ExponentPushToken[ok]" }],
    });
    await notifyUser(BASE);
    expect(Expo.__sent.map((m) => m.to)).toEqual(["ExponentPushToken[ok]"]);
  });

  test("throws on missing required fields", async () => {
    await expect(notifyUser({ uid: "u1", role: "member", title: "t", body: "b" })).rejects.toThrow(/type/);
  });
});
