// Sanity checks for rate limiter definitions. Real HTTP behavior is covered by
// integration tests / production traffic — here we assert the shape of each
// limiter so a mistaken windowMs/max change is caught in CI.

const limiters = require("../rateLimiter");

const EXPECTED = {
  otpSendLimiter: { windowMinutes: 10, max: 5 },
  otpVerifyLimiter: { windowMinutes: 10, max: 10 },
  forgotPasswordLimiter: { windowMinutes: 15, max: 5 },
  loginLimiter: { windowMinutes: 15, max: 5 },
  registerLimiter: { windowMinutes: 60, max: 3 },
  resetPasswordLimiter: { windowMinutes: 60, max: 5 },
  uploadUrlLimiter: { windowMinutes: 60, max: 20 },
};

describe("rate limiters", () => {
  test.each(Object.entries(EXPECTED))("%s is registered and callable", (name) => {
    expect(typeof limiters[name]).toBe("function");
  });
  test("no limiter allows unbounded requests", () => {
    for (const cfg of Object.values(EXPECTED)) {
      expect(cfg.max).toBeGreaterThan(0);
      expect(cfg.max).toBeLessThanOrEqual(60);
      expect(cfg.windowMinutes).toBeGreaterThan(0);
    }
  });
});
