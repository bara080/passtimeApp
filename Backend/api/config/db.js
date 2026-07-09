const mongoose = require("mongoose");
const { shouldGracefulInfraBootstrap } = require("./runtime");
const UserSchema = require("../models/userModel");
const RefreshTokenModel = require("../models/refreshTokenModel");
const VerificationSchema = require("../models/verificationModel");
const PasswordResetSchema = require("../models/passwordResetModel");
const WebhookEventSchema = require("../models/webhookEventModel");
const PaymentSchema = require("../models/paymentModel");
const BookingSchema = require("../models/bookingModel");
const NotificationSchema = require("../models/notificationModel");
const ConversationSchema = require("../models/conversationModel");

const connections = {};
let mongoReadyCallback = () => {};

function setMongoReadyCallback(fn) {
  mongoReadyCallback = typeof fn === "function" ? fn : () => {};
}

function refreshMongoReadyFromConnections() {
  const ready =
    connections["member"]?.readyState === 1 &&
    connections["host"]?.readyState === 1;
  mongoReadyCallback(Boolean(ready));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sharedMongoOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 0,
  // Bumped from 55s — Vercel Lambda stays warm ~5min, so a longer idle keeps
  // the pool alive across successive requests without a reconnect.
  maxIdleTimeMS: 270000,
  retryWrites: true,
};

async function closeAllMongoConnections() {
  const closers = [];
  for (const role of ["member", "host"]) {
    if (connections[role]) {
      closers.push(connections[role].close(false).catch(() => {}));
    }
  }
  await Promise.all(closers);
  delete connections["member"];
  delete connections["host"];
}

function wireConnectionEvents(conn, label) {
  conn.on("error", (err) => {
    console.error(`❌ MongoDB error (${label}):`, err.message);
    refreshMongoReadyFromConnections();
  });
  conn.on("disconnected", () => {
    console.warn(`⚠️ MongoDB disconnected (${label})`);
    refreshMongoReadyFromConnections();
  });
  conn.on("connected", () => {
    console.log(`🔄 MongoDB reconnected (${label})`);
    refreshMongoReadyFromConnections();
  });
}

function registerAllModels() {
  for (const role of ["member", "host"]) {
    const conn = connections[role];
    conn.model("User", UserSchema);
    conn.model("RefreshToken", RefreshTokenModel);
    conn.model("Verification", VerificationSchema);
    conn.model("PasswordReset", PasswordResetSchema);
  }
  // Member-only models
  connections["member"].model("WebhookEvent", WebhookEventSchema);
  connections["member"].model("Payment", PaymentSchema);
  connections["member"].model("Booking", BookingSchema);
  connections["member"].model("Conversation", ConversationSchema);

  // Notifications registered in BOTH clusters (a host and a member can share
  // the same uid namespace-wise; notifyUser writes to whichever cluster the
  // recipient's role points to).
  for (const role of ["member", "host"]) {
    connections[role].model("Notification", NotificationSchema);
  }
}

async function establishMongoConnections() {
  connections["member"] = mongoose.createConnection(process.env.MONGO_URL_MEMBER, {
    ...sharedMongoOptions,
    dbName: "member",
  });
  wireConnectionEvents(connections["member"], "member");
  await connections["member"].asPromise();
  console.log("✅ Connected to Member DB");

  connections["host"] = mongoose.createConnection(process.env.MONGO_URL_HOST, {
    ...sharedMongoOptions,
    dbName: "host",
  });
  wireConnectionEvents(connections["host"], "host");
  await connections["host"].asPromise();
  console.log("✅ Connected to Host DB");
}

const connectDB = async () => {
  const bothUp =
    connections["member"]?.readyState === 1 &&
    connections["host"]?.readyState === 1;
  if (bothUp) {
    refreshMongoReadyFromConnections();
    return;
  }

  const maxAttempts = shouldGracefulInfraBootstrap() ? 4 : 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await closeAllMongoConnections();
      await establishMongoConnections();
      registerAllModels();
      refreshMongoReadyFromConnections();
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ DB error (attempt ${attempt}/${maxAttempts}):`, error.message);
      await closeAllMongoConnections();
      refreshMongoReadyFromConnections();
      if (attempt < maxAttempts) {
        await sleep(Math.min(8000, 1000 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError;
};

const getConnection = (role) => {
  if (!connections[role]) {
    throw new Error(`No database connection for role: ${role}`);
  }
  return connections[role];
};

const getUserModel = (role) => getConnection(role).model("User");

module.exports = {
  connectDB,
  getConnection,
  getUserModel,
  setMongoReadyCallback,
  refreshMongoReadyFromConnections,
};
