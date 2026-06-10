const { createClient } = require("redis");
const { shouldGracefulInfraBootstrap } = require("./runtime");

let redisClient = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const redisRetryAttempts = () => (shouldGracefulInfraBootstrap() ? 4 : 3);

function createRedisClient() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const isTLS = url.startsWith("rediss://");
  const client = createClient({
    url,
    socket: {
      tls: isTLS,
      reconnectStrategy: (retries) => {
        console.log(`[redis] reconnect attempt ${retries}`);
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on("error", (err) => console.error("❌ Redis error:", err.message));
  client.on("connect", () => console.log("🔄 Redis connecting..."));
  client.on("ready", () => console.log("✅ Redis ready"));
  client.on("reconnecting", () => console.log("♻️ Redis reconnecting"));

  return client;
}

async function connectRedis() {
  const maxAttempts = redisRetryAttempts();
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!redisClient) redisClient = createRedisClient();
      if (!redisClient.isOpen) await redisClient.connect();

      await redisClient.set("healthcheck", "ok", { EX: 10 });
      const result = await redisClient.get("healthcheck");
      if (result !== "ok") throw new Error("Redis healthcheck failed");

      console.log("🚀 Redis connected & healthy");
      return;
    } catch (err) {
      lastErr = err;
      console.error(`❌ Redis failed (attempt ${attempt}/${maxAttempts}):`, err.message);
      try {
        if (redisClient?.isOpen) await redisClient.quit();
      } catch {}
      redisClient = null;
      if (attempt < maxAttempts) {
        await sleep(Math.min(8000, 1000 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastErr;
}

function getRedis() {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis()");
  return redisClient;
}

async function disconnectRedis() {
  if (redisClient?.isOpen) await redisClient.quit();
}

module.exports = { connectRedis, getRedis, disconnectRedis };
