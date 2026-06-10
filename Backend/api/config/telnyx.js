const { Telnyx } = require("telnyx");

const apiKey = process.env.TELNYX_API_KEY;
const verifyProfileId = process.env.TELNYX_VERIFY_PROFILE_ID;

const telnyxClient =
  apiKey && verifyProfileId ? new Telnyx({ apiKey }) : null;

module.exports = { telnyxClient, verifyProfileId };
