/**
 * Stripe Controller — Passtime
 *
 * Covers:
 *  - Stripe Connect onboarding for Hosts (Express accounts)
 *  - Payment intent creation for Members booking experiences
 *  - Account status / payout readiness checks
 *  - Webhook ingestion (see stripeWebhook.js)
 */

require("dotenv").config();
const stripe = require("../config/stripe");
const { getUserModel, getConnection } = require("../config/db");
const { success, error } = require("../utils/responseFormatter");
const AppError = require("../utils/AppError");

const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || 15);

function log(level, event, meta = {}) {
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta })
  );
}

// ── Host Connect Onboarding ───────────────────────────────────────────────────
exports.createConnectAccount = async (req, res, next) => {
  try {
    if (!stripe) throw new AppError("Stripe not configured.", 500);

    const uid = req.user.uid;
    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid });
    if (!host) return error(res, 404, "Host profile not found.");

    // Reuse existing account if already created
    let accountId = host.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: host.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "individual",
        individual: {
          first_name: host.firstName,
          last_name: host.lastName,
          email: host.email,
        },
        metadata: { uid, role: "host" },
      });
      accountId = account.id;
      await HostModel.updateOne({ uid }, { stripeAccountId: accountId });
      log("log", "stripe.connect.created", { uid, accountId });
    }

    const returnUrl = `${process.env.APP_WEB_URL || "https://passtime.app"}/host/onboarding/complete`;
    const refreshUrl = `${process.env.APP_WEB_URL || "https://passtime.app"}/host/onboarding/refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: "account_onboarding",
    });

    return success(res, "Onboarding link created.", { url: accountLink.url, accountId });
  } catch (err) {
    next(err);
  }
};

// ── Host Connect Account Status ───────────────────────────────────────────────
exports.getConnectAccountStatus = async (req, res, next) => {
  try {
    if (!stripe) throw new AppError("Stripe not configured.", 500);

    const { accountId } = req.params;
    if (!accountId) return error(res, 400, "accountId is required.");

    // Ownership: only the authenticated host who owns this account can query it.
    if (req.userRole !== "host") return error(res, 403, "Not authorized.");
    if (req.user.stripeAccountId !== accountId) return error(res, 403, "Not authorized.");

    const account = await stripe.accounts.retrieve(accountId);

    const payoutReady =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    const pendingRequirements = account.requirements?.currently_due || [];

    return success(res, "OK", {
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      payoutReady,
      pendingRequirements,
    });
  } catch (err) {
    next(err);
  }
};

// ── Create Payment Intent (LEGACY, deprecated) ───────────────────────────────
// Superseded by POST /api/bookings/:id/pay which computes amount from the
// server-side Booking row (see booking.md §4, productionReadiness.md task 7.1).
// Kept behind an env flag for a grace period; new clients must not call it.
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (process.env.ALLOW_LEGACY_PAYMENT_INTENT !== "true") {
      return error(res, 410, "This endpoint is deprecated. Use POST /api/bookings/:id/pay.");
    }
    if (!stripe) throw new AppError("Stripe not configured.", 500);

    const { hostUid, amount, currency = "usd", bookingId, metadata = {} } = req.body;
    const memberUid = req.user.uid;

    if (!hostUid || !amount) return error(res, 400, "hostUid and amount are required.");
    if (typeof amount !== "number" || amount < 50) {
      return error(res, 400, "amount must be a number ≥ 50 (cents).");
    }
    const MAX_AMOUNT_CENTS = 500_000;
    if (amount > MAX_AMOUNT_CENTS) {
      return error(res, 400, "amount exceeds the transaction limit.");
    }
    const ALLOWED_CURRENCIES = ["usd"];
    if (!ALLOWED_CURRENCIES.includes(String(currency).toLowerCase())) {
      return error(res, 400, "Unsupported currency.");
    }
    if (bookingId && !/^[a-zA-Z0-9_-]{1,64}$/.test(String(bookingId))) {
      return error(res, 400, "Invalid bookingId.");
    }

    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid: hostUid }).select("stripeAccountId email");
    if (!host?.stripeAccountId) {
      return error(res, 400, "Host has not completed Stripe onboarding.");
    }

    const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
      application_fee_amount: platformFee,
      transfer_data: { destination: host.stripeAccountId },
      metadata: { memberUid, hostUid, bookingId: bookingId || "", ...metadata },
    });

    // Persist payment record in member cluster
    const conn = getConnection("member");
    const Payment = conn.model("Payment");
    await Payment.create({
      memberUid,
      hostUid,
      bookingId: bookingId || null,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      platformFee,
      status: "pending",
    });

    log("log", "stripe.paymentIntent.created", {
      paymentIntentId: paymentIntent.id,
      memberUid,
      hostUid,
      amount,
    });

    return success(res, "Payment intent created.", {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      platformFee,
    });
  } catch (err) {
    next(err);
  }
};

// ── Payout Readiness Check ────────────────────────────────────────────────────
exports.isPayoutReady = async (req, res, next) => {
  try {
    if (!stripe) throw new AppError("Stripe not configured.", 500);

    const uid = req.user.uid;
    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid }).select("stripeAccountId");
    if (!host?.stripeAccountId) {
      return success(res, "OK", { payoutReady: false, reason: "No Stripe account" });
    }

    const account = await stripe.accounts.retrieve(host.stripeAccountId);
    const payoutReady = account.charges_enabled && account.payouts_enabled && account.details_submitted;

    return success(res, "OK", {
      payoutReady,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      pendingRequirements: account.requirements?.currently_due || [],
    });
  } catch (err) {
    next(err);
  }
};

// ── Start Payout Onboarding (refresh link) ────────────────────────────────────
exports.startPayoutOnboarding = async (req, res, next) => {
  try {
    if (!stripe) throw new AppError("Stripe not configured.", 500);

    const uid = req.user.uid;
    const HostModel = getUserModel("host");
    const host = await HostModel.findOne({ uid }).select("stripeAccountId");
    if (!host?.stripeAccountId) {
      return error(res, 400, "No Stripe account found. Complete onboarding first.");
    }

    const returnUrl = `${process.env.APP_WEB_URL || "https://passtime.app"}/host/onboarding/complete`;
    const refreshUrl = `${process.env.APP_WEB_URL || "https://passtime.app"}/host/onboarding/refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: host.stripeAccountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: "account_onboarding",
    });

    return success(res, "Onboarding link refreshed.", { url: accountLink.url });
  } catch (err) {
    next(err);
  }
};
