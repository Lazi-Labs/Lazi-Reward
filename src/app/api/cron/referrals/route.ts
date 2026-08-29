import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { contacts, referrals } from "@/db/schema";
import { OPEN_REFERRAL_STATUSES, REFERRAL_MIN_INVOICE, completeReferral, setReferralStatus } from "@/lib/referrals";
import { getLead, isServiceTitanConfigured, listCompletedJobsForCustomer } from "@/lib/servicetitan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Belt-and-braces poller (Vercel cron, every 15 min). For every open referral
 * that has a ServiceTitan customer id: mark `hired` once the lead converted,
 * and `completed` once a completed job appears for that customer after the
 * referral was created. The Worker normally gets there first; this covers
 * it being down.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isServiceTitanConfigured()) return NextResponse.json({ skipped: "servicetitan_not_configured" });

  const rows = await db
    .select({ r: referrals, refs: contacts.externalRefs })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .where(
      and(
        inArray(referrals.status, OPEN_REFERRAL_STATUSES),
        sql`${contacts.externalRefs} ->> 'st_customer_id' IS NOT NULL`,
      ),
    )
    .limit(200);

  const out: Record<string, string> = {};
  for (const { r, refs } of rows) {
    const stCustomerId = Number(refs?.st_customer_id);
    if (!stCustomerId) continue;
    try {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      // Lead converted → hired
      if (r.status !== "hired" && meta.st_lead_id) {
        const lead = await getLead(Number(meta.st_lead_id));
        if (lead.status === "Converted") await setReferralStatus(r.id, "hired", { st_lead_status: lead.status });
      }
      // Completed job after the referral → completed + reward
      const jobs = await listCompletedJobsForCustomer(stCustomerId, r.createdAt);
      // Prefer the first qualifying job (more than the dispatch fee); else the latest.
      const job =
        jobs.find((j) => j.completedOn && (j.total ?? 0) > REFERRAL_MIN_INVOICE) ??
        jobs.find((j) => j.completedOn);
      if (job) {
        const res = await completeReferral({
          referralId: r.id,
          source: "poller",
          stJobId: String(job.id),
          invoiceTotal: job.total ?? null,
          metadata: { st_job_number: job.jobNumber, campaign_id: job.campaignId ?? null },
        });
        out[r.id] = res.ok ? (res.already ? "already" : "completed") : res.reason;
      } else {
        out[r.id] = "open";
      }
    } catch (err) {
      out[r.id] = `error: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
    }
  }
  return NextResponse.json({ checked: rows.length, out });
}
