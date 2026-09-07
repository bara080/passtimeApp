require("./instrument");
require("dotenv").config();
// Fail closed: refuse to boot if the test-OTP hook is ever enabled in production.
require("./api/utils/testOtp").assertTestOtpSafeForProd();
const app = require("./api/app");

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Passtime API running on port ${PORT}`);
  });
}

module.exports = app;
