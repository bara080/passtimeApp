// TimeWorth transactional email templates.
// Source of truth: Figma "TimeWorth" file f5O9nqJROMOfHLu2a95SLh, section "Email Template" (node 1176-6082).
// Variables use Resend's {{{VAR}}} syntax so the same HTML works as a Resend
// hosted template (pushed via scripts/sync-resend-templates.js) and for local
// rendering via renderTemplate().

const ASSET_BASE = "https://www.passtimeapp.com";
const SITE_URL = "https://www.passtimeapp.com";
const PRIVACY_URL = `${SITE_URL}/privacy`;

const COLORS = {
  bg: "#eaeaea",
  card: "#ffffff",
  accent: "#ff9933",
  accentDark: "#ff6633",
  codeBox: "#f4f4f4",
  codeText: "#3f3f3f",
  text: "#000000",
  muted: "#5b5b5b",
  divider: "#e9e9e9",
};

const FONT = `'Open Sans', Helvetica, Arial, sans-serif`;

function button(label, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="${COLORS.accent}" style="border-radius:6px;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:16px 44px;font-family:${FONT};font-size:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function codeBox(codeVar) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="${COLORS.codeBox}" style="border-radius:16px;padding:28px 10px;">
          <span style="font-family:${FONT};font-size:56px;font-weight:700;letter-spacing:14px;color:${COLORS.codeText};">${codeVar}</span>
        </td>
      </tr>
    </table>`;
}

function greeting() {
  return `<p style="margin:0 0 12px;font-family:${FONT};font-size:20px;color:${COLORS.text};text-align:center;">Hi <strong>{{{name}}}</strong>!</p>`;
}

function heading(text) {
  return `<h1 style="margin:28px 0 20px;font-family:${FONT};font-size:34px;font-weight:700;color:${COLORS.text};text-align:center;">${text}</h1>`;
}

function paragraph(text, opts = {}) {
  const bold = opts.bold ? "font-weight:700;" : "";
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.5;color:${COLORS.text};text-align:center;${bold}">${text}</p>`;
}

function layout(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Passtime</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${COLORS.bg}">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${COLORS.card};border-radius:16px;box-shadow:0 0 10px rgba(0,0,0,0.15);">
          <tr>
            <td align="center" style="padding:32px 40px 24px;border-bottom:1px solid ${COLORS.divider};">
              <img src="${ASSET_BASE}/passtimeLogo.png" alt="Passtime" width="180" style="display:block;width:180px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 24px;">
              ${bodyHtml}
              <p style="margin:32px 0 0;font-family:${FONT};font-size:15px;color:${COLORS.text};text-align:center;">Thank you!<br /><strong>Passtime</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 40px 28px;border-top:1px solid ${COLORS.divider};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;">
                <tr>
                  <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/email/icon-facebook.png" alt="Facebook" width="22" height="22" style="display:block;border:0;" /></a></td>
                  <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/email/icon-x.png" alt="X" width="18" height="18" style="display:block;border:0;" /></a></td>
                  <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/email/icon-instagram.png" alt="Instagram" width="22" height="22" style="display:block;border:0;" /></a></td>
                  <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/email/icon-youtube.png" alt="YouTube" width="22" height="22" style="display:block;border:0;" /></a></td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-family:${FONT};font-size:12px;color:${COLORS.muted};">&copy; 2026 Passtime App. All Rights Reserved.</p>
              <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:600;color:${COLORS.muted};">
                <a href="${PRIVACY_URL}" target="_blank" style="color:${COLORS.muted};text-decoration:underline;">Privacy Policy</a>
                &nbsp;|&nbsp;
                <a href="${SITE_URL}" target="_blank" style="color:${COLORS.muted};text-decoration:underline;">Contact Us</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:28px 0 0;font-family:${FONT};font-size:15px;color:${COLORS.text};text-align:center;">
          Have a question or trouble logging in? Please contact us
          <a href="${SITE_URL}" target="_blank" style="color:${COLORS.accent};text-decoration:underline;">here</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function appPromo() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" align="center" bgcolor="${COLORS.codeBox}" style="margin:24px auto 0;border-radius:16px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 8px;font-family:${FONT};font-size:18px;font-weight:700;color:${COLORS.text};text-align:center;">Get our Passtime app!</p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.5;color:${COLORS.text};text-align:center;">Get the most of Passtime by installing our mobile app. You can log in by using your existing email address and password.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/appleStoreLogo.png" alt="Download on the App Store" height="40" style="display:block;height:40px;width:auto;border:0;" /></a></td>
              <td style="padding:0 6px;"><a href="${SITE_URL}" target="_blank"><img src="${ASSET_BASE}/googlePlayStoreLogo.png" alt="Get it on Google Play" height="40" style="display:block;height:40px;width:auto;border:0;" /></a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function welcomeFeature(title, text) {
  return `
    <tr>
      <td style="padding:10px 0;">
        <p style="margin:0 0 4px;font-family:${FONT};font-size:16px;font-weight:700;color:${COLORS.accentDark};text-align:center;">${title}</p>
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.5;color:${COLORS.text};text-align:center;">${text}</p>
      </td>
    </tr>`;
}

const TEMPLATES = {
  "email-verification": {
    subject: "Verify your email — Passtime",
    figmaNode: "1171:5100",
    variables: ["name", "code"],
    html: layout(`
      ${heading("Complete Registration")}
      ${greeting()}
      ${paragraph("Please enter this confirmation code in the window where you started creating your account.")}
      ${codeBox("{{{code}}}")}
      ${paragraph("From your mobile device use the code to confirm email.")}
      ${paragraph("This code expires in 10 minutes.")}
      ${paragraph("If you didn't create an account in Passtime, please ignore this message.")}
    `),
  },

  welcome: {
    subject: "Welcome to Passtime!",
    figmaNode: "1178:7088",
    variables: ["name"],
    html: layout(`
      ${greeting()}
      ${heading("Welcome to Passtime")}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${welcomeFeature("Create a Profile", "Set your availability, rates, and preferences. Upload verification to build trust.")}
        ${welcomeFeature("Discover &amp; Book", "Search by category, location, and availability. Send a booking request with clear expectations.")}
        ${welcomeFeature("Confirm &amp; Connect", "Once both sides agree, payment is securely held in escrow and chat unlocks for coordination.")}
      </table>
      ${appPromo()}
    `),
  },

  "verification-reminder": {
    subject: "Just a friendly reminder to verify your email — Passtime",
    figmaNode: "1172:5660",
    variables: ["name", "verifyUrl"],
    html: layout(`
      ${greeting()}
      ${heading("Just a friendly reminder to verify your email address")}
      ${paragraph("For security reasons, please help us by verifying your email address. Verify within 28 days of first signing up to keep your account active.")}
      ${button("Verify your email", "{{{verifyUrl}}}")}
    `),
  },

  "password-reset": {
    subject: "Reset your Passtime password",
    figmaNode: "1176:6037",
    variables: ["name", "code"],
    html: layout(`
      ${heading("Forgot your password?")}
      ${greeting()}
      ${paragraph("Passtime recently received a request for a forgotten password. Enter this code in the app to reset your password:")}
      ${codeBox("{{{code}}}")}
      ${paragraph("This code expires in 10 minutes.")}
      ${paragraph("If you did not request this change, you do not need to do anything.")}
    `),
  },

  "payment-receipt": {
    subject: "Your Passtime payment receipt",
    figmaNode: "1172:5779",
    variables: ["name", "amount", "receiptNumber", "datePaid", "paymentMethod", "hostName"],
    html: layout(`
      ${greeting()}
      ${heading("Payment Receipt")}
      ${paragraph("Thank you for your payment! Below are the details of your transaction:")}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" align="center" bgcolor="${COLORS.codeBox}" style="margin:8px auto 24px;border-radius:16px;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 16px;font-family:${FONT};font-size:14px;color:${COLORS.muted};">Receipt #{{{receiptNumber}}}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:4px 0;font-family:${FONT};font-size:12px;font-weight:700;color:${COLORS.muted};">AMOUNT PAID</td>
                <td style="padding:4px 0;font-family:${FONT};font-size:12px;font-weight:700;color:${COLORS.muted};">DATE PAID</td>
                <td style="padding:4px 0;font-family:${FONT};font-size:12px;font-weight:700;color:${COLORS.muted};">PAYMENT METHOD</td>
              </tr>
              <tr>
                <td style="padding:2px 0 14px;font-family:${FONT};font-size:15px;color:${COLORS.text};">{{{amount}}}</td>
                <td style="padding:2px 0 14px;font-family:${FONT};font-size:15px;color:${COLORS.text};">{{{datePaid}}}</td>
                <td style="padding:2px 0 14px;font-family:${FONT};font-size:15px;color:${COLORS.text};">{{{paymentMethod}}}</td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;font-weight:700;color:${COLORS.muted};">SUMMARY</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${COLORS.divider};">
              <tr>
                <td style="padding:10px 0;font-family:${FONT};font-size:15px;color:${COLORS.text};">Payment to {{{hostName}}}</td>
                <td align="right" style="padding:10px 0;font-family:${FONT};font-size:15px;color:${COLORS.text};">{{{amount}}}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:1px solid ${COLORS.divider};font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.text};">Amount paid</td>
                <td align="right" style="padding:10px 0;border-top:1px solid ${COLORS.divider};font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.text};">{{{amount}}}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ${paragraph("If you have any questions, please contact us through the Passtime app.")}
    `),
  },

  "unread-messages": {
    subject: "You have unread messages on Passtime",
    figmaNode: "1180:7207",
    variables: ["name", "count", "url"],
    html: layout(`
      ${greeting()}
      ${heading("You have {{{count}}} unread messages from Passtime")}
      ${paragraph("Continue communication with the host. Don't miss out on a great experience.")}
      ${button("View and reply now", "{{{url}}}")}
      ${appPromo()}
    `),
  },

  "account-approved": {
    subject: "Your Passtime account has been approved!",
    figmaNode: "1178:6796",
    variables: ["name", "url"],
    html: layout(`
      ${greeting()}
      ${heading("Your Passtime account has been approved!")}
      ${paragraph("Your Passtime account has been approved and you can now log in to your Passtime account.")}
      ${button("Get started", "{{{url}}}")}
      ${appPromo()}
    `),
  },

  "booking-canceled": {
    subject: "Your Passtime booking has been canceled",
    figmaNode: "1181:7425",
    variables: ["name", "hostName", "url"],
    html: layout(`
      ${greeting()}
      ${heading("Your booking has been canceled")}
      ${paragraph("Your booking with {{{hostName}}} was canceled because payment was not completed in time.")}
      ${paragraph("You can go to the Passtime app and make payment.")}
      ${button("Make payment", "{{{url}}}")}
    `),
  },

  "booking-declined": {
    subject: "Your Passtime booking request was declined",
    figmaNode: "1188:7477",
    variables: ["name", "hostName", "url"],
    html: layout(`
      ${greeting()}
      ${heading("Your booking has been declined")}
      ${paragraph("Your booking request has been declined by {{{hostName}}}. You can explore other hosts.")}
      ${button("Explore more", "{{{url}}}")}
    `),
  },

  "session-ended": {
    subject: "Your Passtime session has ended",
    figmaNode: "1190:16970",
    variables: ["name", "url"],
    html: layout(`
      ${greeting()}
      ${heading("Your session has ended")}
      ${paragraph("Your Passtime session has ended. We hope you had a great experience!")}
      ${paragraph("You can go to the Passtime app and leave a review.")}
      ${button("Leave a review", "{{{url}}}")}
    `),
  },

  "session-happening-now": {
    subject: "Your Passtime session is happening now",
    figmaNode: "1193:17642",
    variables: ["name", "url"],
    html: layout(`
      ${greeting()}
      ${heading("Your session is happening now")}
      ${paragraph("Your Passtime session is happening now. Tap to open the chat and enjoy your experience.")}
      ${button("Open chat", "{{{url}}}")}
    `),
  },

  goodbye: {
    subject: "We hate to say goodbyes — Passtime",
    figmaNode: "1179:7166",
    variables: ["name", "url"],
    html: layout(`
      ${heading("We hate to say goodbyes")}
      ${paragraph("So we're emailing you one last time.")}
      ${paragraph("We can take a hint ({{{name}}}). Let us know if you want to continue receiving emails from Passtime, or we'll stop sending them.")}
      ${paragraph("&ldquo;WAIT! I don't want to miss out on upcoming events and product announcements.&rdquo;", { bold: true })}
      ${button("Keep them coming", "{{{url}}}")}
    `),
  },
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Local render — same {{{var}}} syntax as Resend hosted templates.
// Values are HTML-escaped since they can contain user input (display names).
function renderTemplate(name, variables = {}) {
  const template = TEMPLATES[name];
  if (!template) throw new Error(`Unknown email template: ${name}`);
  let html = template.html;
  for (const [key, value] of Object.entries(variables)) {
    html = html.split(`{{{${key}}}}`).join(escapeHtml(value ?? ""));
  }
  return html;
}

module.exports = { TEMPLATES, renderTemplate };
