// One-shot: purge the 2026-08 test identities from prod, reset referrer
// 39XKZKW4 counters, and point both businesses at the PROD Tremendous
// campaign (I6K6558HNU2J). Run:
//   node --env-file=.env.local scripts/purge-test-rows.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const contactIds = [
  "3a56fa1a-f9ae-4dfe-85e9-fb0d77f471c2", // Yianni R +18134645986
  "95e8ddf8-333a-4e50-99c3-c6160927a0c4", // ST Test Friend 727-555-0177
  "e46613d4-c9c8-4710-925f-b13a1b292ffa", // Api Test Customer (referrer 4LJ8WF7W)
];
const out = {};
const reqIds = (await sql`select id from review_requests where contact_id = ANY(${contactIds})`).map((r) => r.id);
const refIds = (await sql`select id from referrals where referred_contact_id = ANY(${contactIds})`).map((r) => r.id);
out.gifts = (await sql`delete from gift_cards where contact_id = ANY(${contactIds}) or review_request_id = ANY(${reqIds}) or external_id = ${"gifttest0001"} returning id`).length;
out.tasks = (await sql`delete from tasks where contact_id = ANY(${contactIds}) or referral_id = ANY(${refIds}) returning id`).length;
out.comms = (await sql`delete from communication_logs where contact_id = ANY(${contactIds}) returning id`).length;
out.submissions = (await sql`delete from submissions where contact_id = ANY(${contactIds}) returning id`).length;
out.reviews = (await sql`delete from reviews where contact_id = ANY(${contactIds}) returning id`).length;
out.requests = (await sql`delete from review_requests where id = ANY(${reqIds}) returning id`).length;
out.clicks = (await sql`delete from referral_clicks where referrer_id in (select id from referrers where contact_id = ANY(${contactIds})) returning id`).length;
out.rewards = (await sql`delete from referral_rewards where referral_id = ANY(${refIds}) or id = ${"cb08b088-e8f1-4569-8c6c-b98ffa8e0d34"} returning id`).length;
out.referrals = (await sql`delete from referrals where id = ANY(${refIds}) returning id`).length;
out.referrers = (await sql`delete from referrers where contact_id = ANY(${contactIds}) returning referral_code`).length;
out.contacts = (await sql`delete from contacts where id = ANY(${contactIds}) returning id`).length;
out.reset39XKZKW4 = (await sql`update referrers set converted_referrals = 0, total_earnings = 0 where referral_code = ${"39XKZKW4"} returning id`).length;
out.campaign = (await sql`update businesses set tremendous_campaign_id = ${"I6K6558HNU2J"} returning slug`).map((b) => b.slug);
console.log(JSON.stringify(out, null, 2));
