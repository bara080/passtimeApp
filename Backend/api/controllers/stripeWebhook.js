require("dotenv").config();
const stripe = require("../config/stripe");
const { getConnection } = require("../config/db");
const { getUserModel } = require("../config/db");
const { canTransition } = require("../utils/bookingStateMachine");
const { notifyUser } = require("../utils/notifyUser");

function log(level, event, meta = {}) {
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta })
  );
}

exports.handleStripeWebhook = async (req, res) => {
  if (!stripe) {
    log("warn", "stripe.webhook.skipped", { reason: "Stripe not configured" });
    return res.sendStatus(200);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log("error", "stripe.webhook.signature.invalid", { message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency guard — skip duplicate events
  const conn = getConnection("member");
  const WebhookEvent = conn.model("WebhookEvent");
  try {
    await WebhookEvent.create({ stripeEventId: event.id, type: event.type });
  } catch (err) {
    if (err.code === 11000) {
      log("warn", "stripe.webhook.duplicate", { eventId: event.id, type: event.type });
      return res.sendStatus(200);
    }
    log("error", "stripe.webhook.idempotency.failed", { message: err.message });
    return res.sendStatus(500);
  }

  log("log", "stripe.webhook.received", { eventId: event.id, type: event.type });

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      default:
        log("log", "stripe.webhook.unhandled", { type: event.type });
    }
  } catch (err) {
    log("error", "stripe.webhook.handler.failed", { type: event.type, message: err.message });
    // Still return 200 so Stripe doesn't retry (we already persisted the event)
  }

  return res.sendStatus(200);
};

// ── Payment Succeeded ─────────────────────────────────────────────────────────
async function handlePaymentSucceeded(paymentIntent) {
  const { id, metadata } = paymentIntent;
  const conn = getConnection("member");
  const Payment = conn.model("Payment");
  const Booking = conn.model("Booking");

  await Payment.updateOne(
    { stripePaymentIntentId: id },
    { status: "succeeded" }
  );

  // Advance the booking accepted → confirmed. Idempotent: same event replayed
  // hits the state-machine guard the second time and no-ops. bookingId comes
  // from the PaymentIntent metadata we set in booking.pay.
  const bookingId = metadata?.bookingId;
  if (bookingId) {
    const booking = await Booking.findOne({ bookingId });
    if (booking) {
      const decision = canTransition(booking.status, "pay_confirmed", "system");
      if (decision.ok) {
        booking.status = decision.to;
        booking.logs.push({ at: new Date(), actor: "system", event: "pay_confirmed" });
        await booking.save();
        log("log", "booking.confirmed", { bookingId, paymentIntentId: id });
        // Notify both parties on payment success — booking is now confirmed.
        notifyUser({
          uid: booking.hostUid,
          role: "host",
          title: "Booking confirmed",
          body: `${booking.memberSnapshot?.displayName || "A member"} paid — see you soon.`,
          type: "payment_success",
          data: { bookingId },
        }).catch((e) => console.error("[webhook.notify host] failed:", e.message));
        notifyUser({
          uid: booking.memberUid,
          role: "member",
          title: "Payment confirmed",
          body: "Your booking is locked in.",
          type: "payment_success",
          data: { bookingId },
        }).catch((e) => console.error("[webhook.notify member] failed:", e.message));
      } else {
        // Idempotent replay or race — informational only.
        log("log", "booking.pay.noop", { bookingId, status: booking.status, reason: decision.message });
      }
    }
  }

  log("log", "stripe.payment.succeeded", {
    paymentIntentId: id,
    memberUid: metadata?.memberUid,
    hostUid: metadata?.hostUid,
    bookingId,
  });
}

// ── Payment Failed ────────────────────────────────────────────────────────────
async function handlePaymentFailed(paymentIntent) {
  const conn = getConnection("member");
  const Payment = conn.model("Payment");

  await Payment.updateOne(
    { stripePaymentIntentId: paymentIntent.id },
    { status: "failed" }
  );

  log("warn", "stripe.payment.failed", { paymentIntentId: paymentIntent.id });
}

// ── Connected Account Updated ─────────────────────────────────────────────────
async function handleAccountUpdated(account) {
  const uid = account.metadata?.uid;
  if (!uid) return;

  const payoutReady =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted;

  const HostModel = getUserModel("host");
  await HostModel.updateOne(
    { uid },
    {
      "stripe.chargesEnabled": account.charges_enabled,
      "stripe.payoutsEnabled": account.payouts_enabled,
      "stripe.detailsSubmitted": account.details_submitted,
      "stripe.payoutReady": payoutReady,
    }
  );

  log("log", "stripe.account.updated", { uid, payoutReady });
}
