const { toPublicHostCard, computeAge } = require("../publicProjections");

const FULL_HOST = {
  uid: "host-1",
  email: "secret@example.com",
  password: "$2b$12$hash",
  phoneNumber: "+15550001111",
  dateOfBirth: new Date("1995-06-15"),
  displayName: "Alex Chen",
  firstName: "Alex",
  lastName: "Chen",
  avatarUrl: "https://x/avatar.jpg",
  photos: [{ path: "media/host-1/a.jpg", url: "https://x/a.jpg" }],
  location: { country: "US", state: "MN", city: "Minneapolis", address: "1 Secret Home Address" },
  experienceTypes: ["dinner-companion"],
  hourlyRate: 5000,
  currency: "usd",
  hostOnboardingStep: "done",
  hostOnboardingComplete: true,
  isActive: true,
};

describe("toPublicHostCard — privacy boundary", () => {
  const card = toPublicHostCard(FULL_HOST);

  test("never leaks private fields", () => {
    const serialized = JSON.stringify(card);
    expect(serialized).not.toMatch(/secret@example.com/);
    expect(serialized).not.toMatch(/\+15550001111/);
    expect(serialized).not.toMatch(/\$2b\$12/);
    expect(serialized).not.toMatch(/Secret Home Address/);
    expect(serialized).not.toMatch(/1995-06-15/); // raw DOB
    expect(card).not.toHaveProperty("email");
    expect(card).not.toHaveProperty("phoneNumber");
    expect(card).not.toHaveProperty("dateOfBirth");
    expect(card).not.toHaveProperty("password");
  });

  test("exposes exactly the allowlisted card fields", () => {
    expect(Object.keys(card).sort()).toEqual(
      ["age", "city", "currency", "displayName", "experienceTypes", "firstName", "hourlyRate", "photoUrl", "uid"].sort()
    );
  });

  test("computes age from DOB and picks first photo + city", () => {
    expect(typeof card.age).toBe("number");
    expect(card.photoUrl).toBe("https://x/a.jpg");
    expect(card.city).toBe("Minneapolis");
  });

  test("falls back to avatarUrl when photos are empty, null when neither", () => {
    expect(toPublicHostCard({ ...FULL_HOST, photos: [] }).photoUrl).toBe("https://x/avatar.jpg");
    expect(toPublicHostCard({ ...FULL_HOST, photos: [], avatarUrl: null }).photoUrl).toBeNull();
  });

  test("handles missing optional fields without throwing", () => {
    const minimal = toPublicHostCard({ uid: "h2" });
    expect(minimal.uid).toBe("h2");
    expect(minimal.displayName).toBe("Host");
    expect(minimal.age).toBeNull();
    expect(minimal.city).toBeNull();
    expect(minimal.experienceTypes).toEqual([]);
  });
});

describe("computeAge", () => {
  test("null for missing/invalid/implausible", () => {
    expect(computeAge(undefined)).toBeNull();
    expect(computeAge("not-a-date")).toBeNull();
    expect(computeAge(new Date("1850-01-01"))).toBeNull();
  });
  test("computes a plausible adult age", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 30);
    dob.setDate(dob.getDate() - 1);
    expect(computeAge(dob)).toBe(30);
  });
});
