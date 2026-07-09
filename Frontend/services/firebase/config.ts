// Firebase JS SDK — used ONLY for RTDB message listeners.
// Config values here are public-safe (protected by the RTDB security rules in
// Backend/firebase/database.rules.json). No auth calls, no firestore.
//
// SDK choice: JS SDK over @react-native-firebase/database — chat.md §1 called
// this out. JS SDK is OTA-updatable and needs no native module or new build.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "passtime-29a50.firebaseapp.com",
  projectId: "passtime-29a50",
  storageBucket: "passtime-29a50.firebasestorage.app",
  databaseURL: "https://passtime-29a50-default-rtdb.firebaseio.com",
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

/** Lazy singleton — only initializes when a listener actually needs RTDB. */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!FIREBASE_CONFIG.apiKey) {
    if (__DEV__) console.warn("[firebase] EXPO_PUBLIC_FIREBASE_API_KEY missing; RTDB features disabled.");
    return null;
  }
  app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return app;
}

export function getRealtimeDb(): Database | null {
  if (db) return db;
  const a = getFirebaseApp();
  if (!a) return null;
  db = getDatabase(a);
  return db;
}
