import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { contacts, referrals, referrers } from "@/db/schema";
import { OPEN_REFERRAL_STATUSES, REFERRAL_MIN_INVOICE, completeReferral, setReferralStatus } from "@/lib/referrals";
import {
  getBooking,
  getJob,
  getLead,
  isServiceTitanConfigured,
  listCompletedJobsForCustomer,
  markCustomerReferred,
} from "@/lib/servicetitan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Belt-and-braces poller (Vercel cron, every 15 min) for every open referral
 * that reached ServiceTitan:
 *
 *  1. Booking → job. A CRM booking is not linked to a customer; ST matches or
 *     creates one when the CSR converts it. Once `status=Converted` we read the
 *     job, adopt its customerId (may differ from the one we pre-created),
 *     re-stamp the Referred Customer tag + Referral Code field on it, and mark
 *     the referral `hired`.
 *  2. Lead → job (legacy fallback path): lead Converted → `hired`.
 *  3. Completed job (> $89) for that customer after the referral → completed +
 *     reward. The Worker normally gets there first; this covers it being down.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isServiceTitanConfigured()) return NextResponse.json({ skipped: "servicetitan_not_configured" });

  const rows = await db
    .select({ r: referrals, contactId: contacts.id, refs: contacts.externalRefs, code: referrers.referralCode })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .innerJoin(referrers, eq(referrals.referrerId, referrers.id))
    .where(
      and(
        inArray(referrals.status, OPEN_REFERRAL_STATUSES),
        sql`(${contacts.externalRefs} ->> 'st_customer_id' IS NOT NULL OR ${referrals.metadata} ->> 'st_booking_id' IS NOT NULL)`,
      ),
    )
    .limit(200);

  const out: Record<string, string> = {};
  for (const { r, contactId, refs, code } of rows) {
    try {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      let stCustomerId = Number(refs?.st_customer_id) || 0;
      let status = r.status;

      // 1) Booking converted → adopt the real customer, re-stamp marker, hired.
      if (meta.st_booking_id && !meta.st_booked_job_id) {
        const booking = await getBooking(Number(meta.st_booking_id));
        if (booking.status === "Converted" && booking.jobId) {
          const job = await getJob(booking.jobId);
          const extra: Record<string, unknown> = { st_booked_job_id: String(job.id), st_booking_status: booking.status };
          if (job.customerId && job.customerId !== stCustomerId) {
            extra.st_customer_id_precreated = stCustomerId ? String(stCustomerId) : null;
            stCustomerId = job.customerId;
            await db
              .update(contacts)
              .set({
                externalRefs: sql`COALESCE(${contacts.externalRefs}, '{}'::jsonb) || ${JSON.stringify({
                  st_customer_id: String(job.customerId),
                  ...(job.locationId ? { st_location_id: String(job.locationId) } : {}),
                })}::jsonb`,
                updatedAt: new Date(),
              })
              .where(eq(contacts.id, contactId));
          }
          if (stCustomerId) await markCustomerReferred(stCustomerId, code).catch((e) => console.error("markCustomerReferred", e));
          if (status !== "hired") {
            await setReferralStatus(r.id, "hired", extra);
            status = "hired";
          } else {
            await db.update(referrals).set({ metadata: { ...meta, ...extra } }).where(eq(referrals.id, r.id));
          }
        } else if (booking.status !== "New" && booking.status !== String(meta.st_booking_status ?? "")) {
          await db.update(referrals).set({ metadata: { ...meta, st_booking_status: booking.status } }).where(eq(referrals.id, r.id));
        }
      }

      // 2) Lead converted → hired (fallback path when no booking provider).
      if (status !== "hired" && meta.st_lead_id) {
        const lead = await getLead(Number(meta.st_lead_id));
        if (lead.status === "Converted") {
          await setReferralStatus(r.id, "hired", { st_lead_status: lead.status });
          status = "hired";
        }
      }

      if (!stCustomerId) {
        out[r.id] = status === "hired" ? "hired" : "awaiting_conversion";
        continue;
      }

      // 3) Completed job after the referral → completed + reward.
      const jobs = await listCompletedJobsForCustomer(stCustomerId, r.createdAt);
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
        out[r.id] = status === "hired" ? "hired" : "open";
      }
    } catch (err) {
      out[r.id] = `error: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
    }
  }
  return NextResponse.json({ checked: rows.length, out });
}
