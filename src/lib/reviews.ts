import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  businesses,
  contacts,
  giftCards,
  reviewRequests,
  reviews,
  tasks,
  type CommChannel,
  type ReviewRequestStatus,
} from "@/db/schema";
import { brandFor, reviewBaseUrl } from "@/lib/brand";
import { getRequestOrigin } from "@/lib/referrals";

const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function generateToken(len = 12) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)];
  }
  return out;
}

export async function listActiveBusinesses() {
  return db.query.businesses.findMany({
    where: eq(businesses.isActive, true),
    orderBy: businesses.sortOrder,
  });
}

export async function getBusinessBySlug(slug: string) {
  return db.query.businesses.findFirst({
    where: and(eq(businesses.slug, slug), eq(businesses.isActive, true)),
  });
}

/** The public link customers receive. */
export async function reviewLinkFor(
  businessSlug: string,
  token?: string | null,
): Promise<string> {
  const base = reviewBaseUrl(await getRequestOrigin());
  return token
    ? `${base}/review/${businessSlug}/${token}`
    : `${base}/review/${businessSlug}`;
}

/** Where a happy customer is sent: DB value first, brand fallback second. */
export function googleReviewUrlFor(biz: {
  slug: string;
  gmbUrl: string | null;
}): string | null {
  return biz.gmbUrl ?? brandFor(biz.slug).googleReviewUrl;
}

export async function getReviewRequestByToken(token: string) {
  return db.query.reviewRequests.findFirst({
    where: eq(reviewRequests.token, token),
    with: { business: true, contact: true },
  });
}

export async function markReviewRequestClicked(id: string) {
  await db
    .update(reviewRequests)
    .set({ status: "clicked", clickedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(reviewRequests.id, id), eq(reviewRequests.status, "sent")));
  // Requests still "queued" (link generated but never marked sent) also count.
  await db
    .update(reviewRequests)
    .set({ status: "clicked", clickedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(reviewRequests.id, id), eq(reviewRequests.status, "queued")));
}

/**
 * Staff action: create (or reuse) a contact and mint a tokenized review link.
 */
export async function createReviewRequest(args: {
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  channel: CommChannel;
}) {
  let contact = args.email
    ? await db.query.contacts.findFirst({
        where: and(
          eq(contacts.businessId, args.businessId),
          eq(contacts.email, args.email),
        ),
      })
    : null;
  if (!contact && args.phone) {
    contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.businessId, args.businessId),
        eq(contacts.phone, args.phone),
      ),
    });
  }
  if (!contact) {
    const [created] = await db
      .insert(contacts)
      .values({
        businessId: args.businessId,
        name: args.name,
        email: args.email ?? null,
        phone: args.phone ?? null,
        source: "review",
      })
      .returning();
    contact = created;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [created] = await db
        .insert(reviewRequests)
        .values({
          businessId: args.businessId,
          contactId: contact.id,
          channel: args.channel,
          status: "queued",
          token: generateToken(),
        })
        .returning();
      return created;
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique review token");
}

export async function markReviewRequestSent(id: string) {
  await db
    .update(reviewRequests)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(reviewRequests.id, id));
}

/**
 * Customer picked a star rating. Always records a `reviews` row so we keep
 * the score even if they bounce before finishing the funnel.
 */
export async function recordRating(args: {
  businessId: string;
  contactId: string | null;
  requestId: string | null;
  rating: number;
  sentToGoogle: boolean;
}) {
  const [review] = await db
    .insert(reviews)
    .values({
      businessId: args.businessId,
      contactId: args.contactId,
      rating: args.rating,
      source: "internal",
      content: args.sentToGoogle
        ? `Rated ${args.rating}/5 — sent to Google review step.`
        : `Rated ${args.rating}/5 — sent to feedback questionnaire.`,
    })
    .returning();

  if (args.requestId) {
    await db
      .update(reviewRequests)
      .set({ status: "clicked", updatedAt: new Date() })
      .where(
        and(
          eq(reviewRequests.id, args.requestId),
          eq(reviewRequests.status, "queued"),
        ),
      );
  }
  return review;
}

/** Low-score path: questionnaire + optional manager callback task. */
export async function recordFeedback(args: {
  businessId: string;
  requestId: string | null;
  contactId: string | null;
  reviewId: string;
  rating: number;
  scores: Record<string, number>;
  message: string;
  name: string;
  phone: string;
  wantsCall: boolean;
}) {
  const lines = Object.entries(args.scores).map(([k, v]) => `${k}: ${v}/5`);
  const content = [
    `Overall: ${args.rating}/5`,
    ...lines,
    args.message ? `\n${args.message}` : "",
    args.name || args.phone ? `\n— ${args.name} ${args.phone}`.trim() : "",
  ]
    .filter(Boolean)
    .join("\n");

  await db
    .update(reviews)
    .set({ content, updatedAt: new Date() })
    .where(eq(reviews.id, args.reviewId));

  if (args.requestId) {
    await db
      .update(reviewRequests)
      .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(reviewRequests.id, args.requestId));
  }

  if (args.wantsCall) {
    await db.insert(tasks).values({
      contactId: args.contactId,
      title: `Manager callback — ${args.name || "review feedback"} (${args.rating}/5)`,
      notes: `${args.phone ? `Phone: ${args.phone}\n` : ""}${content}`,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }
}

// ── Admin listings ───────────────────────────────────────────────────────────

export type ReviewRequestRow = {
  id: string;
  token: string;
  status: ReviewRequestStatus;
  channel: CommChannel;
  createdAt: Date;
  sentAt: Date | null;
  clickedAt: Date | null;
  submittedAt: Date | null;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  businessName: string;
  businessSlug: string;
  gift: {
    id: string;
    status: string;
    amount: string;
    redemptionLink: string | null;
    failureReason: string | null;
  } | null;
};

export async function listReviewRequests(limit = 100): Promise<ReviewRequestRow[]> {
  const rows = await db
    .select({
      giftId: giftCards.id,
      giftStatus: giftCards.status,
      giftAmount: giftCards.amount,
      giftLink: giftCards.redemptionLink,
      giftReason: giftCards.failureReason,
      id: reviewRequests.id,
      token: reviewRequests.token,
      status: reviewRequests.status,
      channel: reviewRequests.channel,
      createdAt: reviewRequests.createdAt,
      sentAt: reviewRequests.sentAt,
      clickedAt: reviewRequests.clickedAt,
      submittedAt: reviewRequests.submittedAt,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(reviewRequests)
    .innerJoin(contacts, eq(reviewRequests.contactId, contacts.id))
    .innerJoin(businesses, eq(reviewRequests.businessId, businesses.id))
    .leftJoin(giftCards, eq(giftCards.reviewRequestId, reviewRequests.id))
    .orderBy(desc(reviewRequests.createdAt))
    .limit(limit);
  return rows.map(({ giftId, giftStatus, giftAmount, giftLink, giftReason, ...r }) => ({
    ...r,
    status: r.status as ReviewRequestStatus,
    channel: r.channel as CommChannel,
    gift: giftId
      ? {
          id: giftId,
          status: giftStatus ?? "created",
          amount: giftAmount ?? "0",
          redemptionLink: giftLink,
          failureReason: giftReason,
        }
      : null,
  }));
}

export type FeedbackRow = {
  id: string;
  rating: number | null;
  content: string;
  createdAt: Date;
  contactName: string | null;
  businessName: string | null;
};

export async function listRecentFeedback(limit = 50): Promise<FeedbackRow[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      contactName: contacts.name,
      businessName: businesses.name,
    })
    .from(reviews)
    .leftJoin(contacts, eq(reviews.contactId, contacts.id))
    .leftJoin(businesses, eq(reviews.businessId, businesses.id))
    .where(and(eq(reviews.source, "internal"), isNotNull(reviews.rating)))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
  return rows;
}

export const REVIEW_REQUEST_STATUS_LABEL: Record<ReviewRequestStatus, string> = {
  queued: "Link ready",
  sent: "Sent",
  clicked: "Opened",
  submitted: "Responded",
  failed: "Failed",
};
