"use server";

import { z } from "zod";

import { FEEDBACK_QUESTIONS } from "@/lib/brand";
import { claimGift, getGiftForReviewRequest } from "@/lib/gifts";
import {
  getBusinessBySlug,
  getReviewRequestByToken,
  recordFeedback,
  recordRating,
} from "@/lib/reviews";

/** Resolve who is rating: tokenized request (known contact) or anonymous slug. */
async function resolveContext(businessSlug: string, token: string | null) {
  if (token) {
    const req = await getReviewRequestByToken(token);
    if (req && req.business.slug === businessSlug) {
      return {
        businessId: req.businessId,
        requestId: req.id,
        contact: req.contact,
      };
    }
  }
  const biz = await getBusinessBySlug(businessSlug);
  if (!biz) throw new Error("Unknown business");
  return { businessId: biz.id, requestId: null, contact: null };
}

const ratingSchema = z.object({
  businessSlug: z.string().min(1),
  token: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  sentToGoogle: z.boolean(),
});

export async function rateAction(input: z.infer<typeof ratingSchema>) {
  const data = ratingSchema.parse(input);
  const ctx = await resolveContext(data.businessSlug, data.token);
  const review = await recordRating({
    businessId: ctx.businessId,
    contactId: ctx.contact?.id ?? null,
    requestId: ctx.requestId,
    rating: data.rating,
    sentToGoogle: data.sentToGoogle,
  });
  return { reviewId: review.id };
}

const feedbackSchema = z.object({
  businessSlug: z.string().min(1),
  token: z.string().nullable(),
  reviewId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  scores: z.partialRecord(z.enum(FEEDBACK_QUESTIONS), z.number().int().min(1).max(5)),
  message: z.string().max(4000),
  name: z.string().max(120),
  phone: z.string().max(40),
  wantsCall: z.boolean(),
});

export async function feedbackAction(input: z.infer<typeof feedbackSchema>) {
  const data = feedbackSchema.parse(input);
  const ctx = await resolveContext(data.businessSlug, data.token);
  await recordFeedback({
    businessId: ctx.businessId,
    requestId: ctx.requestId,
    contactId: ctx.contact?.id ?? null,
    reviewId: data.reviewId,
    rating: data.rating,
    scores: data.scores,
    message: data.message.trim(),
    name: data.name.trim() || ctx.contact?.name || "",
    phone: data.phone.trim() || ctx.contact?.phone || "",
    wantsCall: data.wantsCall,
  });
  return { ok: true as const };
}

const claimSchema = z.object({
  businessSlug: z.string().min(1),
  token: z.string().min(1),
  productId: z.string().min(1).max(64),
});

export type ClaimGiftResult =
  | { ok: true; link: string; productName: string }
  | { ok: false; error: string };

/** Customer picked a gift card in the funnel → create the Tremendous order. */
export async function claimGiftAction(input: z.infer<typeof claimSchema>): Promise<ClaimGiftResult> {
  const data = claimSchema.parse(input);
  const req = await getReviewRequestByToken(data.token);
  if (!req || req.business.slug !== data.businessSlug) return { ok: false, error: "Unknown request" };
  const gift = await getGiftForReviewRequest(req.id);
  if (!gift) return { ok: false, error: "No gift on this request" };
  const row = await claimGift(gift.id, data.productId);
  if (!row) return { ok: false, error: "Gift not found" };
  if ((row.status === "created" || row.status === "delivered") && row.redemptionLink) {
    return { ok: true, link: row.redemptionLink, productName: row.productName ?? "your gift" };
  }
  return {
    ok: false,
    error:
      row.failureReason === "not_configured"
        ? "Gift cards aren't set up yet — call us and we'll take care of it."
        : "We couldn't issue your gift just now. Please call us and we'll sort it out.",
  };
}
