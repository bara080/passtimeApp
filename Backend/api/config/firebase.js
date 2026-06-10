require("dotenv").config();
const admin = require("firebase-admin");

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

console.log("HANDSHAKE | FIREBASE | Admin initialized");

module.exports = admin;
