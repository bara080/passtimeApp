// Direct provider-token verification (no client-side Firebase dependency).
// Pattern borrowed from the working Zinga implementation: the app sends the
// raw Google idToken / Apple identityToken; we verify against the provider.

const { OAuth2Client } = require("google-auth-library");

const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || "com.passtime.app";

const googleClient = new OAuth2Client(GOOGLE_WEB_CLIENT_ID);

// jose is ESM-only — require() crashes Vercel's CJS runtime at boot.
// Lazy dynamic import, resolved once and cached (JWKS set cached with it).
let joseSetupPromise;
function getAppleVerifier() {
  joseSetupPromise ??= import("jose").then((jose) => ({
    jwtVerify: jose.jwtVerify,
    jwks: jose.createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),
  }));
  return joseSetupPromise;
}

/**
 * Verifies a raw provider token and normalizes the identity.
 *
 * @param {"google"|"apple"} provider
 * @param {string} idToken - Google: the `idToken` from GoogleSignin (JWT signed by
 *   Google, audience must equal GOOGLE_WEB_CLIENT_ID). Apple: the `identityToken`
 *   from AppleAuthentication (JWT signed by Apple, audience must equal the app
 *   bundle id, issuer https://appleid.apple.com).
 * @returns {Promise<{sub: string, email?: string, emailVerified: boolean, name?: string, picture?: string}>}
 *   `sub` is namespaced ("google:…"/"apple:…") and becomes the user's uid on first login.
 * @throws on signature/audience/issuer/expiry failures — callers must map to 401.
 *
 * Notes:
 * - Apple returns `email` only on the user's FIRST authorization for this app;
 *   subsequent tokens may omit it (the controller 400s in that case — acceptable
 *   because first-login always creates the account with the email present).
 * - Google's JWKS is cached by google-auth-library; Apple's via jose's RemoteJWKSet.
 */
async function verifySocialToken(provider, idToken) {
  if (provider === "google") {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_WEB_CLIENT_ID,
    });
    const p = ticket.getPayload();
    return {
      sub: `google:${p.sub}`,
      email: p.email,
      emailVerified: Boolean(p.email_verified),
      name: p.name,
      picture: p.picture,
    };
  }

  if (provider === "apple") {
    const { jwtVerify, jwks } = await getAppleVerifier();
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: "https://appleid.apple.com",
      audience: APPLE_BUNDLE_ID,
    });
    return {
      sub: `apple:${payload.sub}`,
      email: payload.email,
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
      name: undefined,
      picture: undefined,
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

module.exports = { verifySocialToken };
