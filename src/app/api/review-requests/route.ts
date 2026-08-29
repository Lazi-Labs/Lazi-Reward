import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { brandFor } from "@/lib/brand";
import { issueGiftForReviewRequest } from "@/lib/gifts";
import { buildReviewRequestMessage } from "@/lib/messages";
import { createReviewRequest, getBusinessBySlug, reviewLinkFor } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Machine endpoint for upstream automations (ServiceTitan → GHL sync Worker).
 * Mints a per-customer review request + offered gift and returns the URL to
 * put in the customer's text/email.
 *
 *   POST /api/review-requests
 *   Authorization: Bearer $REVIEW_API_KEY
 *   { business: "perfect-catch-electric", name, phone?, email?, channel?,
 *     externalRefs?: { ghl_contact_id, st_customer_id, … },
 *     metadata?: { st_job_id, st_job_number, invoice_total, technician, … } }
 *
 *   201 { url, token, requestId, contactId, gift: { amount } | null, message }
 *
 * Idempotency: pass `metadata.st_job_id` — a second call for the same job
 * returns the existing request (no new token, no second gift).
 */

const bodySchema = z
  .object({
    business: z.string().min(1),
    name: z.string().min(1).max(160),
    phone: z.string().min(7).max(30).optional().nullable(),
    email: z.string().email().optional().nullable(),
    channel: z.enum(["sms", "email", "call", "note", "system"]).default("sms"),
    externalRefs: z.record(z.string(), z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.phone || d.email, { message: "phone or email required" });

function authorized(req: Request) {
  const expected = process.env.REVIEW_API_KEY?.trim();
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const biz = await getBusinessBySlug(data.business);
  if (!biz) return NextResponse.json({ error: "unknown_business" }, { status: 404 });

  // Idempotent on the ServiceTitan job when provided.
  const stJobId =
    typeof data.metadata?.st_job_id === "string" || typeof data.metadata?.st_job_id === "number"
      ? String(data.metadata.st_job_id)
      : null;
  const { db } = await import("@/db");
  const { reviewRequests } = await import("@/db/schema");
  const { and, eq, sql } = await import("drizzle-orm");
  if (stJobId) {
    const existing = await db.query.reviewRequests.findFirst({
      where: and(
        eq(reviewRequests.businessId, biz.id),
        sql`${reviewRequests.metadata} ->> 'st_job_id' = ${stJobId}`,
      ),
      with: { giftCard: true },
    });
    if (existing) {
      const url = await reviewLinkFor(biz.slug, existing.token);
      return NextResponse.json(
        {
          url,
          token: existing.token,
          requestId: existing.id,
          contactId: existing.contactId,
          gift: existing.giftCard ? { amount: Number(existing.giftCard.amount) } : null,
          message: buildReviewRequestMessage({
            brand: brandFor(biz.slug),
            firstName: data.name.split(" ")[0] ?? null,
            reviewLink: url,
            giftAmount: existing.giftCard ? Number(existing.giftCard.amount) : null,
          }),
          existing: true,
        },
        { status: 200 },
      );
    }
  }

  const request = await createReviewRequest({
    businessId: biz.id,
    name: data.name,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    channel: data.channel,
    externalRefs: data.externalRefs,
    metadata: data.metadata,
  });
  const gift = await issueGiftForReviewRequest(request.id);
  const url = await reviewLinkFor(biz.slug, request.token);
  const message = buildReviewRequestMessage({
    brand: brandFor(biz.slug),
    firstName: data.name.split(" ")[0] ?? null,
    reviewLink: url,
    giftAmount: gift ? Number(gift.amount) : null,
  });

  return NextResponse.json(
    {
      url,
      token: request.token,
      requestId: request.id,
      contactId: request.contactId,
      gift: gift ? { amount: Number(gift.amount) } : null,
      message,
      existing: false,
    },
    { status: 201 },
  );
}
