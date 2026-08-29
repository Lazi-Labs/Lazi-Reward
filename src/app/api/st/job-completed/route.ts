import { timingSafeEqual } from "node:crypto";

import { and, eq, notInArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { contacts, referrals, referrers } from "@/db/schema";
import { OPEN_REFERRAL_STATUSES, completeReferral, setReferralStatus } from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ServiceTitan → us (via the ST→GHL Worker): a job completed and was paid.
 * We match it to an open referral and, if found, complete it (creates the
 * referrer's reward). Idempotent on st_job_id.
 *
 *   POST /api/st/job-completed   Authorization: Bearer $REVIEW_API_KEY
 *   { st_customer_id, st_job_id, st_job_number?, invoice_total?, completed_at?,
 *     campaign_id?, customer_tags?: string[], referral_code?: string, phone?, email?, name? }
 *   → 200 { matched: boolean, referralId?, rewardId?, already?: boolean, reason? }
 */

const body = z.object({
  st_customer_id: z.union([z.string(), z.number()]).transform(String),
  st_job_id: z.union([z.string(), z.number()]).transform(String),
  st_job_number: z.union([z.string(), z.number()]).transform(String).optional(),
  invoice_total: z.number().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  campaign_id: z.union([z.string(), z.number()]).transform(String).optional().nullable(),
  customer_tags: z.array(z.string()).optional(),
  referral_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
});

function authorized(req: Request) {
  const expected = process.env.REVIEW_API_KEY?.trim();
  if (!expected) return false;
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  return provided.length === expected.length && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", details: z.flattenError(parsed.error) }, { status: 400 });
  }
  const d = parsed.data;

  // Already applied for this job?
  const done = await db.query.referrals.findFirst({
    where: sql`${referrals.metadata} ->> 'st_job_id' = ${d.st_job_id}`,
  });
  if (done) return NextResponse.json({ matched: true, referralId: done.id, already: true });

  // 1) Referral code on the ST customer.
  let referral: typeof referrals.$inferSelect | undefined;
  const code = d.referral_code?.trim().toUpperCase();
  if (code) {
    const ref = await db.query.referrers.findFirst({ where: eq(referrers.referralCode, code) });
    if (ref) {
      // Prefer an open referral whose contact matches this ST customer; else the newest open one for this referrer.
      const byContact = await db
        .select({ r: referrals })
        .from(referrals)
        .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
        .where(
          and(
            eq(referrals.referrerId, ref.id),
            notInArray(referrals.status, ["rejected", "cancelled", "completed"]),
            sql`${contacts.externalRefs} ->> 'st_customer_id' = ${d.st_customer_id}`,
          ),
        )
        .limit(1);
      referral = byContact[0]?.r;
      if (!referral) {
        // The office may have added the code on a customer we never saw — create the link now.
        const { attributeReferral } = await import("@/lib/referrals");
        const res = await attributeReferral({
          code,
          contact: { name: d.name ?? `ST customer ${d.st_customer_id}`, phone: d.phone ?? null, email: d.email ?? null },
          source: "servicetitan",
          status: "hired",
          metadata: { st_customer_id: d.st_customer_id },
        });
        if (res.ok) {
          referral = res.referral;
          await db
            .update(contacts)
            .set({ externalRefs: sql`COALESCE(${contacts.externalRefs}, '{}'::jsonb) || ${JSON.stringify({ st_customer_id: d.st_customer_id })}::jsonb` })
            .where(eq(contacts.id, res.contactId));
        }
      }
    }
  }

  // 2) Contact already linked to this ST customer, or 3) phone/email match.
  if (!referral) {
    const conds = [sql`${contacts.externalRefs} ->> 'st_customer_id' = ${d.st_customer_id}`];
    const phone = d.phone?.trim();
    const email = d.email?.trim().toLowerCase();
    if (phone) conds.push(sql`regexp_replace(${contacts.phone}, '\\D', '', 'g') LIKE ${"%" + phone.replace(/\D/g, "").slice(-10)}`);
    if (email) conds.push(eq(contacts.email, email));
    const rows = await db
      .select({ r: referrals })
      .from(referrals)
      .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
      .where(and(notInArray(referrals.status, ["rejected", "cancelled", "completed"]), or(...conds)))
      .limit(1);
    referral = rows[0]?.r;
  }

  if (!referral) return NextResponse.json({ matched: false, reason: "no_open_referral" });
  if (!OPEN_REFERRAL_STATUSES.includes(referral.status)) {
    return NextResponse.json({ matched: true, referralId: referral.id, already: true });
  }

  await setReferralStatus(referral.id, "hired");
  const result = await completeReferral({
    referralId: referral.id,
    source: "servicetitan",
    stJobId: d.st_job_id,
    invoiceTotal: d.invoice_total ?? null,
    metadata: {
      st_customer_id: d.st_customer_id,
      st_job_number: d.st_job_number,
      campaign_id: d.campaign_id,
      completed_at: d.completed_at,
      customer_tags: d.customer_tags,
    },
  });
  if (!result.ok) return NextResponse.json({ matched: true, referralId: referral.id, error: result.reason }, { status: 500 });
  return NextResponse.json({ matched: true, referralId: referral.id, rewardId: result.reward.id, already: result.already });
}
