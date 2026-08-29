/**
 * One-time: register our webhook endpoint with Tremendous and print the signing
 * secret to store as TREMENDOUS_WEBHOOK_SECRET.
 *
 *   node --env-file=.env.local --import tsx scripts/tremendous-register-webhook.ts https://pce-rewards-liv-pools.vercel.app
 *
 * Run once per environment (sandbox key → sandbox webhook, PROD key → prod webhook).
 */
import { createWebhook, isTremendousConfigured, tremendousBaseUrl } from "../src/lib/tremendous";

const origin = process.argv[2];
if (!origin) {
  console.error("usage: tremendous-register-webhook.ts <https://app-origin>");
  process.exit(1);
}
if (!isTremendousConfigured()) {
  console.error("TREMENDOUS_API_KEY is not set");
  process.exit(1);
}

const url = `${origin.replace(/\/+$/, "")}/api/webhooks/tremendous`;
const res = await createWebhook(url);
console.log(`Registered ${res.webhook.url} on ${tremendousBaseUrl()} (id ${res.webhook.id})`);
console.log("\nStore this as TREMENDOUS_WEBHOOK_SECRET (it is only shown once):\n");
console.log(res.webhook.private_key);
