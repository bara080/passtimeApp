// Lazy Firebase Admin — initializes on first use, not at module require time.
// Motivation: require("./config/firebase") used to run admin.initializeApp
// synchronously during app.js boot, blocking the parallel Mongo+Redis dial
// and adding ~200ms to every cold start. Routes that don't touch Firebase
// (dashboard, most auth endpoints) now skip that cost entirely.

require("dotenv").config();
const admin = require("firebase-admin");

let _initialized = false;

function ensureInitialized() {
  if (_initialized) return admin;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Add it to Backend/.env — see .env.example for format."
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${e.message}. Ensure it is a single-line stringified JSON object.`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
    storageBucket: process.env.FIREBASE_BUCKET_URL,
  });

  _initialized = true;
  console.log("HANDSHAKE | FIREBASE | Admin initialized (lazy)");
  return admin;
}

// Proxy that initializes on first property access. Consumers that already do
// `const admin = require("./config/firebase"); admin.storage().bucket()` keep
// working — the first `.storage()` triggers init.
module.exports = new Proxy(admin, {
  get(target, prop) {
    ensureInitialized();
    return target[prop];
  },
});
