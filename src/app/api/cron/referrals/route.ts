import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { contacts, referrals, referrers } from "@/db/schema";
import { reconcileGiftDeliveries } from "@/lib/gifts";
import { OPEN_REFERRAL_STATUSES, REFERRAL_MIN_INVOICE, completeReferral, setReferralStatus } from "@/lib/referrals";
import {
  findCustomerByPhone,
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
 *
 * Then reconciles the gift ledger against Tremendous (see
 * `reconcileGiftDeliveries`) so a missed webhook cannot leave a claimed gift
 * stuck at `created`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Gift reconciliation does not depend on ServiceTitan, so it runs either way.
  if (!isServiceTitanConfigured()) {
    const gifts = await reconcileGiftDeliveries().catch((err) => ({
      checked: 0,
      updated: 0,
      results: { error: err instanceof Error ? err.message : String(err) },
    }));
    return NextResponse.json({ skipped: "servicetitan_not_configured", gifts });
  }

  const rows = await db
    .select({
      r: referrals,
      contactId: contacts.id,
      refs: contacts.externalRefs,
      phone: contacts.phone,
      name: contacts.name,
      code: referrers.referralCode,
    })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .innerJoin(referrers, eq(referrals.referrerId, referrers.id))
    .where(
      and(
        inArray(referrals.status, OPEN_REFERRAL_STATUSES),
        // Includes referrals with no ServiceTitan ids at all: the booking call
        // can fail (metadata.st_pending), and those used to be skipped forever.
        // We recover them below by matching the customer on phone.
      ),
    )
    .limit(200);

  const out: Record<string, string> = {};
  for (const { r, contactId, refs, phone, name, code } of rows) {
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

      // 1b) No ServiceTitan ids at all (the booking/lead call failed at submit
      //     time, or the office booked the job by hand). Recover by matching
      //     the customer on phone, then stamp the referral marker on them.
      if (!stCustomerId && !meta.st_booking_id && !meta.st_lead_id && phone) {
        const found = await findCustomerByPhone(phone, name ?? undefined);
        if (found) {
          stCustomerId = found.id;
          await db
            .update(contacts)
            .set({
              externalRefs: sql`COALESCE(${contacts.externalRefs}, '{}'::jsonb) || ${JSON.stringify({
                st_customer_id: String(found.id),
              })}::jsonb`,
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId));
          await markCustomerReferred(found.id, code).catch((e) => console.error("markCustomerReferred", e));
          await db
            .update(referrals)
            .set({ metadata: { ...meta, st_recovered_by: "phone", st_pending: false } })
            .where(eq(referrals.id, r.id));
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
  // Gift ledger: Tremendous webhooks can be missed, so reconcile claimed gifts
  // against the order status rather than trusting the webhook alone.
  const gifts = await reconcileGiftDeliveries().catch((err) => ({
    checked: 0,
    updated: 0,
    results: { error: err instanceof Error ? err.message : String(err) },
  }));

  return NextResponse.json({ checked: rows.length, out, gifts });
}
