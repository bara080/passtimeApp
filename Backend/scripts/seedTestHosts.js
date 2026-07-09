// Seed 8 fully-onboarded test host accounts from /Users/bara080/bara/passtime/testAssests.
// Usage:  node scripts/seedTestHosts.js
// Idempotent: re-running skips hosts whose email already exists (prints "exists").
//
// Never run against production — hard-guarded by NODE_ENV.

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { connectDB, getUserModel } = require("../api/config/db");
const admin = require("../api/config/firebase");

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed test hosts in production.");
  process.exit(1);
}

const ASSETS_DIR = "/Users/bara080/bara/passtime/testAssests";
const PORTRAIT_RE = /^home screen images (\d+) 1\.png$/;
const EXTRA_RE = /^profile detail image (?:main )?(\d+) 1\.png$/;

const CATEGORIES = [
  "dinner-companion",
  "event-partner",
  "social-companion",
  "fitness-companion",
  "activity-partner",
  "networking-companion",
];

const CITIES = [
  { country: "US", state: "New York", city: "Brooklyn", address: "42 Bedford Ave" },
  { country: "US", state: "California", city: "Los Angeles", address: "1200 Sunset Blvd" },
  { country: "US", state: "Illinois", city: "Chicago", address: "88 Lake St" },
  { country: "US", state: "Washington", city: "Seattle", address: "1301 Pike St" },
  { country: "US", state: "Texas", city: "Austin", address: "600 Congress Ave" },
  { country: "US", state: "Massachusetts", city: "Boston", address: "70 Newbury St" },
  { country: "US", state: "Colorado", city: "Denver", address: "500 16th St" },
  { country: "US", state: "Minnesota", city: "Minneapolis", address: "1 Nicollet Mall" },
];

const NAMES = [
  { first: "Jessica", last: "Parker", role: "Professional model" },
  { first: "Liam", last: "Johnson", role: "Photographer" },
  { first: "Sophia", last: "Lee", role: "Stylist" },
  { first: "Oliver", last: "Smith", role: "Chef" },
  { first: "Mia", last: "Chen", role: "Personal trainer" },
  { first: "Noah", last: "Wilson", role: "Musician" },
  { first: "Ava", last: "Brown", role: "Event host" },
  { first: "Ethan", last: "Davis", role: "Actor" },
];

async function uploadImage(localPath, destPath, contentType = "image/png") {
  const bucketName = process.env.FIREBASE_BUCKET_URL;
  const bucket = bucketName ? admin.storage().bucket(bucketName) : admin.storage().bucket();
  const file = bucket.file(destPath);
  const downloadToken = uuidv4();
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });
  const encoded = encodeURIComponent(destPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${downloadToken}`;
}

async function seedOne(index, portraitPath, extraPaths) {
  const person = NAMES[index] || NAMES[NAMES.length - 1];
  const city = CITIES[index % CITIES.length];
  const email = `seed.${person.first.toLowerCase()}.${person.last.toLowerCase()}@test.passtime.dev`;
  const password = "TestPass1234";

  const HostModel = getUserModel("host");
  const existing = await HostModel.findOne({ email });
  if (existing) {
    console.log(`— skip (exists): ${email}`);
    return;
  }

  const uid = uuidv4();

  // Upload avatar (portrait) + up to 4 gallery photos to the same host uid prefix.
  const avatarUrl = await uploadImage(portraitPath, `avatars/${uid}.png`);
  const photos = [{ path: `avatars/${uid}.png`, url: avatarUrl }];
  for (const p of extraPaths.slice(0, 4)) {
    const destPath = `media/${uid}/${uuidv4()}.png`;
    const url = await uploadImage(p, destPath);
    photos.push({ path: destPath, url });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const dob = new Date(now.getFullYear() - (26 + (index % 8)), 5, 15);
  const displayName = `${person.first} ${person.last}`;

  await HostModel.create({
    uid,
    email,
    password: passwordHash,
    role: "host",
    firstName: person.first,
    lastName: person.last,
    displayName,
    avatarUrl,
    phoneNumber: `+15555${String(1000 + index).padStart(4, "0")}`,
    dateOfBirth: dob,
    emailVerified: true,
    phoneVerified: true,
    isActive: true,
    professionalRole: person.role,
    bio: `Hi, I'm ${person.first}. I host memorable experiences in ${city.city}.`,
    experienceTypes: [CATEGORIES[index % CATEGORIES.length], CATEGORIES[(index + 1) % CATEGORIES.length]],
    hourlyRate: 3000 + (index % 6) * 1000,
    currency: "usd",
    location: city,
    photos,
    availability: {
      weekly: Array.from({ length: 7 }, (_, d) => ({
        day: d,
        enabled: d >= 1 && d <= 5,
        ranges: d >= 1 && d <= 5 ? [{ start: "09:00", end: "17:00" }] : [],
      })),
      blockedDates: [],
      bookingConfig: { minMinutes: 60, maxMinutes: 240, bufferMinutes: 30 },
    },
    hostOnboardingStep: "done",
    hostOnboardingComplete: true,
  });

  console.log(`✓ seeded ${displayName}  ${email}  ${city.city}  photos=${photos.length}`);
}

async function main() {
  await connectDB();

  const files = fs.readdirSync(ASSETS_DIR);
  const portraits = files
    .filter((f) => PORTRAIT_RE.test(f))
    .sort((a, b) => Number(a.match(PORTRAIT_RE)[1]) - Number(b.match(PORTRAIT_RE)[1]))
    .map((f) => path.join(ASSETS_DIR, f));
  const extras = files
    .filter((f) => EXTRA_RE.test(f))
    .map((f) => path.join(ASSETS_DIR, f));

  if (portraits.length === 0) {
    console.error(`No portrait assets found in ${ASSETS_DIR}. Expected files like 'home screen images N 1.png'.`);
    process.exit(2);
  }

  console.log(`Found ${portraits.length} portraits and ${extras.length} extra photos.`);
  for (let i = 0; i < portraits.length; i++) {
    // Rotate through the extras so each host gets a different-looking gallery.
    const rotatedExtras = extras.length ? [...extras.slice(i), ...extras.slice(0, i)] : [];
    try {
      await seedOne(i, portraits[i], rotatedExtras);
    } catch (err) {
      console.error(`✗ failed host ${i}:`, err.message);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
