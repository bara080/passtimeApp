#!/usr/bin/env node
// Push all templates in api/emails to Resend as hosted templates (upsert by name).
// Usage: node scripts/sync-resend-templates.js
// Prints NAME → TEMPLATE_ID so the ids can be set as env vars.

require("dotenv").config();
const { TEMPLATES } = require("../api/emails");

const API = "https://api.resend.com";
const KEY = process.env.RESEND_API_KEY;

async function resend(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

(async () => {
  if (!KEY || KEY.includes("PLACEHOLDER")) {
    console.error("RESEND_API_KEY is not set (or is a placeholder).");
    process.exit(1);
  }

  const existing = await resend("GET", "/templates");
  const byName = new Map((existing.data || []).map((t) => [t.name, t]));

  const results = {};
  for (const [name, tpl] of Object.entries(TEMPLATES)) {
    const payload = {
      name,
      html: tpl.html,
      variables: (tpl.variables || []).map((key) => ({ key, type: "string" })),
    };
    const found = byName.get(name);
    if (found) {
      try {
        await resend("PATCH", `/templates/${found.id}`, payload);
        results[name] = found.id;
        console.log(`updated: ${name} → ${found.id}`);
      } catch (err) {
        // Resend PATCH sometimes rejects unchanged variables ("Variable 'X' not
        // defined") — recreate instead. Note: the template gets a NEW id.
        await resend("DELETE", `/templates/${found.id}`);
        const created = await resend("POST", "/templates", payload);
        results[name] = created.id;
        console.log(`recreated: ${name} → ${created.id} (was ${found.id})`);
      }
    } else {
      const created = await resend("POST", "/templates", payload);
      results[name] = created.id;
      console.log(`created: ${name} → ${created.id}`);
    }
    // API-created/updated templates are drafts — publish or sends fail
    await resend("POST", `/templates/${results[name]}/publish`);
    console.log(`published: ${name}`);
  }

  console.log("\nEnv vars for the templates the backend sends today:");
  console.log(`RESEND_EMAIL_VERIFY_TEMPLATE_ID=${results["email-verification"]}`);
  console.log(`RESEND_WELCOME_TEMPLATE_ID=${results["welcome"]}`);
  console.log(`RESEND_PASSWORD_RESET_TEMPLATE_ID=${results["password-reset"]}`);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
