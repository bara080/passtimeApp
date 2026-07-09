const { isValidEmail, validatePassword, validateName, validateDateOfBirth } = require("../validators");

describe("isValidEmail", () => {
  test.each([
    ["ok@example.com", true],
    ["a+b@sub.example.co.uk", true],
    ["missing-at.example.com", false],
    ["missing-tld@example", false],
    ["with space@example.com", false],
    ["", false],
    [null, false],
    [undefined, false],
  ])("%p → %p", (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe("validatePassword", () => {
  test("accepts an 8+ character password", () => {
    expect(validatePassword("Passw0rd")).toBeNull();
  });
  test("rejects short passwords", () => {
    expect(validatePassword("short")).toMatch(/at least 8/);
  });
  test("rejects excessive length", () => {
    expect(validatePassword("x".repeat(129))).toMatch(/too long/);
  });
  test("rejects non-strings safely", () => {
    expect(validatePassword(null)).toMatch(/at least 8/);
    expect(validatePassword(12345678)).toMatch(/at least 8/);
  });
});

describe("validateName", () => {
  test("accepts common name shapes across scripts", () => {
    expect(validateName("Bara", "First name")).toBeNull();
    expect(validateName("O'Neill", "Last name")).toBeNull();
    expect(validateName("Мария", "First name")).toBeNull();
  });
  test("rejects HTML/script attempts", () => {
    expect(validateName("<script>x", "First name")).toMatch(/letters/);
  });
  test("rejects empty and non-string", () => {
    expect(validateName("", "First name")).toMatch(/letters/);
    expect(validateName(null, "First name")).toMatch(/letters/);
  });
  test("rejects excessive length", () => {
    expect(validateName("a".repeat(51), "First name")).toMatch(/letters/);
  });
});

describe("validateDateOfBirth", () => {
  test("accepts a plausible adult DOB", () => {
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
    const iso = twentyFiveYearsAgo.toISOString().slice(0, 10);
    const result = validateDateOfBirth(iso);
    expect(result.error).toBeUndefined();
    expect(result.date).toBeInstanceOf(Date);
  });
  test("rejects underage", () => {
    const kid = new Date();
    kid.setFullYear(kid.getFullYear() - 10);
    const iso = kid.toISOString().slice(0, 10);
    expect(validateDateOfBirth(iso).error).toMatch(/at least 18/);
  });
  test("rejects implausibly old", () => {
    expect(validateDateOfBirth("1800-01-01").error).toMatch(/plausible/);
  });
  test("rejects invalid strings", () => {
    expect(validateDateOfBirth("not-a-date").error).toMatch(/valid ISO/);
    expect(validateDateOfBirth(null).error).toMatch(/valid ISO/);
  });
});
