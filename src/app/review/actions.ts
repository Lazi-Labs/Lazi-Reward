"use server";

import { z } from "zod";

import { FEEDBACK_QUESTIONS, PAYOUT_IDS } from "@/lib/brand";
import {
  getBusinessBySlug,
  getReviewRequestByToken,
  recordFeedback,
  recordGiftChoice,
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

const giftSchema = z.object({
  businessSlug: z.string().min(1),
  token: z.string().nullable(),
  reviewId: z.string().uuid(),
  payoutId: z.enum(PAYOUT_IDS),
});

export async function chooseGiftAction(input: z.infer<typeof giftSchema>) {
  const data = giftSchema.parse(input);
  const ctx = await resolveContext(data.businessSlug, data.token);
  await recordGiftChoice({
    businessId: ctx.businessId,
    requestId: ctx.requestId,
    contact: ctx.contact
      ? {
          id: ctx.contact.id,
          name: ctx.contact.name,
          email: ctx.contact.email,
          phone: ctx.contact.phone,
        }
      : null,
    reviewId: data.reviewId,
    payoutId: data.payoutId,
  });
  return { ok: true as const };
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
