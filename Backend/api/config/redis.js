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
      // Fail fast on cold start — Vercel serverless can't afford a 30s wait.
      connectTimeout: 5000,
      keepAlive: 15000,
      reconnectStrategy: (retries) => {
        // Cap at 3 retries with quick backoff — after that, degrade rather than block.
        if (retries > 3) return new Error("Redis unavailable — giving up");
        return Math.min(retries * 150, 1500);
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

      // Cheap PING replaces the SET+GET round-trip we used to run — half the
      // number of RTTs on every cold start.
      const pong = await redisClient.ping();
      if (pong !== "PONG") throw new Error(`Redis PING returned ${pong}`);

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
        await sleep(Math.min(2000, 300 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastErr;
}

function getRedis() {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis()");
  return redisClient;
}

/** True when Redis is connected and ready to accept commands. Callers on
 *  cold-start-sensitive paths (auth middleware) check this before touching
 *  Redis so they can degrade gracefully. */
function isRedisReady() {
  return Boolean(redisClient?.isReady);
}

async function disconnectRedis() {
  if (redisClient?.isOpen) await redisClient.quit();
}

module.exports = { connectRedis, getRedis, isRedisReady, disconnectRedis };
