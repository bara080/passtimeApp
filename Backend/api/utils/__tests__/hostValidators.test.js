const {
  EXPERIENCE_TYPES,
  validateExperienceTypes,
  validateHourlyRate,
  validateLocation,
  validateCareer,
  validatePhotos,
  validateStep,
} = require("../hostValidators");

describe("validateExperienceTypes", () => {
  test("accepts a valid selection", () => {
    expect(validateExperienceTypes(["dinner-companion", "event-partner"])).toBeNull();
  });
  test("rejects empty / non-array / unknown / duplicates", () => {
    expect(validateExperienceTypes([])).toMatch(/at least one/);
    expect(validateExperienceTypes("dinner-companion")).toMatch(/at least one/);
    expect(validateExperienceTypes(["skydiving"])).toMatch(/Unknown/);
    expect(validateExperienceTypes(["event-partner", "event-partner"])).toMatch(/Duplicate/);
  });
  test("every catalog key validates", () => {
    expect(validateExperienceTypes(EXPERIENCE_TYPES)).toBeNull();
  });
});

describe("validateHourlyRate", () => {
  test("accepts integer cents in range", () => {
    expect(validateHourlyRate(5000)).toBeNull();
  });
  test("rejects floats, strings, out-of-range", () => {
    expect(validateHourlyRate(50.5)).toMatch(/integer/);
    expect(validateHourlyRate("5000")).toMatch(/integer/);
    expect(validateHourlyRate(50)).toMatch(/between/);
    expect(validateHourlyRate(200000)).toMatch(/between/);
  });
});

describe("validateLocation", () => {
  const good = { country: "US", state: "MN", city: "Minneapolis", address: "1 Main St" };
  test("accepts a complete location", () => {
    expect(validateLocation(good)).toBeNull();
  });
  test("rejects missing fields and over-length", () => {
    expect(validateLocation({ ...good, city: "" })).toMatch(/city/);
    expect(validateLocation({ ...good, address: "x".repeat(121) })).toMatch(/address/);
    expect(validateLocation(null)).toMatch(/required/);
  });
});

describe("validateCareer", () => {
  test("accepts role and bio in bounds", () => {
    expect(validateCareer({ professionalRole: "Chef", bio: "I cook." })).toBeNull();
  });
  test("rejects empty or over-length", () => {
    expect(validateCareer({ professionalRole: "" })).toMatch(/professionalRole/);
    expect(validateCareer({ bio: "x".repeat(1001) })).toMatch(/bio/);
  });
  test("allows either field independently", () => {
    expect(validateCareer({ professionalRole: "Chef" })).toBeNull();
    expect(validateCareer({ bio: "hello" })).toBeNull();
  });
});

describe("validatePhotos", () => {
  const uid = "user-1";
  const photo = (n) => ({ path: `media/${uid}/p${n}.jpg`, url: `https://x/p${n}` });
  test("accepts 2–9 owned photos", () => {
    expect(validatePhotos([photo(1), photo(2)], uid)).toBeNull();
  });
  test("rejects <2, >9, foreign paths", () => {
    expect(validatePhotos([photo(1)], uid)).toMatch(/two photos/);
    expect(validatePhotos(Array.from({ length: 10 }, (_, i) => photo(i)), uid)).toMatch(/nine/);
    expect(validatePhotos([photo(1), { path: "media/other-user/x.jpg", url: "https://x" }], uid)).toMatch(
      /own uploads/
    );
  });
});

describe("validateStep", () => {
  test("accepts known steps, rejects junk", () => {
    expect(validateStep("experiences")).toBeNull();
    expect(validateStep("done")).toBeNull();
    expect(validateStep("hack")).toMatch(/Invalid/);
    expect(validateStep(undefined)).toMatch(/Invalid/);
  });
});
