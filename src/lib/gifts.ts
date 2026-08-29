import { and, count, desc, eq, gte, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  businesses,
  contacts,
  giftCards,
  reviewRequests,
  type GiftCardStatus,
  type GiftDeliveryChannel,
} from "@/db/schema";
import {
  TremendousError,
  createLinkReward,
  isTremendousConfigured,
  type TremendousWebhookEvent,
} from "@/lib/tremendous";

export type GiftCardRow = typeof giftCards.$inferSelect;

function errorReason(err: unknown): string {
  if (err instanceof TremendousError) {
    return err.status ? `tremendous_${err.status}: ${err.message}` : err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Call Tremendous for an existing ledger row and persist the outcome.
 * Safe to call again for a failed row (same external_id → same order).
 */
async function fulfil(row: GiftCardRow, recipient: { name: string; email: string | null }) {
  if (!isTremendousConfigured()) {
    const [updated] = await db
      .update(giftCards)
      .set({ status: "failed", failureReason: "not_configured", updatedAt: new Date() })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }
  try {
    const created = await createLinkReward({
      externalId: row.externalId,
      amount: Number(row.amount),
      currency: row.currencyCode,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      campaignId: row.campaignId,
    });
    const [updated] = await db
      .update(giftCards)
      .set({
        status: "created",
        tremendousOrderId: created.orderId,
        tremendousRewardId: created.rewardId,
        redemptionLink: created.link,
        failureReason: null,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  } catch (err) {
    console.error("Tremendous order failed", row.externalId, err);
    const [updated] = await db
      .update(giftCards)
      .set({ status: "failed", failureReason: errorReason(err).slice(0, 500), updatedAt: new Date() })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }
}

/**
 * The unconditional thank-you gift that accompanies a review request.
 * Idempotent per request: one ledger row, one Tremendous external_id.
 */
export async function issueGiftForReviewRequest(requestId: string): Promise<GiftCardRow | null> {
  const req = await db.query.reviewRequests.findFirst({
    where: eq(reviewRequests.id, requestId),
    with: { business: true, contact: true, giftCard: true },
  });
  if (!req) return null;
  if (req.giftCard && req.giftCard.status !== "failed") return req.giftCard;

  const amount = Number(req.business.giftAmount);
  if (!(amount > 0)) return null; // gifts disabled for this business

  let row = req.giftCard;
  if (!row) {
    const [inserted] = await db
      .insert(giftCards)
      .values({
        businessId: req.businessId,
        contactId: req.contactId,
        reviewRequestId: req.id,
        source: "review_request",
        amount: req.business.giftAmount,
        currencyCode: "USD",
        status: "created",
        externalId: `rr-${req.id}`,
        campaignId: req.business.tremendousCampaignId,
      })
      .onConflictDoNothing({ target: giftCards.reviewRequestId })
      .returning();
    row =
      inserted ??
      (await db.query.giftCards.findFirst({ where: eq(giftCards.reviewRequestId, req.id) })) ??
      null;
    if (!row) return null;
  }
  return fulfil(row, { name: req.contact.name, email: req.contact.email });
}

/** One-off gift from the contact page (or a future referral payout). */
export async function issueManualGift(args: {
  contactId: string;
  amount?: number;
  source?: "manual" | "referral";
}) {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, args.contactId),
    with: { business: true },
  });
  if (!contact) throw new Error("Contact not found");
  const amount = args.amount ?? Number(contact.business.giftAmount);
  const [row] = await db
    .insert(giftCards)
    .values({
      businessId: contact.businessId,
      contactId: contact.id,
      source: args.source ?? "manual",
      amount: amount.toFixed(2),
      currencyCode: "USD",
      status: "created",
      externalId: `${args.source ?? "manual"}-${crypto.randomUUID()}`,
      campaignId: contact.business.tremendousCampaignId,
    })
    .returning();
  return fulfil(row, { name: contact.name, email: contact.email });
}

export async function retryGift(giftId: string) {
  const row = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftId),
    with: { contact: true },
  });
  if (!row) return null;
  if (row.status !== "failed") return row;
  return fulfil(row, { name: row.contact.name, email: row.contact.email });
}

export async function markGiftSent(giftId: string, channel: GiftDeliveryChannel) {
  await db
    .update(giftCards)
    .set({ deliveryChannel: channel, sentAt: new Date(), updatedAt: new Date() })
    .where(eq(giftCards.id, giftId));
}

export async function getGiftForReviewRequest(requestId: string) {
  return db.query.giftCards.findFirst({ where: eq(giftCards.reviewRequestId, requestId) });
}

// ── Admin queries ────────────────────────────────────────────────────────────

export type GiftListRow = {
  id: string;
  status: GiftCardStatus;
  amount: string;
  source: string;
  redemptionLink: string | null;
  failureReason: string | null;
  deliveryChannel: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  contactName: string;
  businessName: string;
  reviewRequestId: string | null;
};

export async function listGiftCards(limit = 100): Promise<GiftListRow[]> {
  const rows = await db
    .select({
      id: giftCards.id,
      status: giftCards.status,
      amount: giftCards.amount,
      source: giftCards.source,
      redemptionLink: giftCards.redemptionLink,
      failureReason: giftCards.failureReason,
      deliveryChannel: giftCards.deliveryChannel,
      sentAt: giftCards.sentAt,
      deliveredAt: giftCards.deliveredAt,
      createdAt: giftCards.createdAt,
      contactName: contacts.name,
      businessName: businesses.name,
      reviewRequestId: giftCards.reviewRequestId,
    })
    .from(giftCards)
    .innerJoin(contacts, eq(giftCards.contactId, contacts.id))
    .innerJoin(businesses, eq(giftCards.businessId, businesses.id))
    .orderBy(desc(giftCards.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, status: r.status as GiftCardStatus }));
}

export async function giftStats() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({
      n: count(),
      total: sql<string>`COALESCE(SUM(${giftCards.amount}), 0)`,
    })
    .from(giftCards)
    .where(
      and(
        gte(giftCards.createdAt, monthStart),
        or(eq(giftCards.status, "created"), eq(giftCards.status, "delivered")),
      ),
    );
  const [failed] = await db
    .select({ n: count() })
    .from(giftCards)
    .where(eq(giftCards.status, "failed"));
  return {
    monthCount: Number(row?.n ?? 0),
    monthTotal: Number(row?.total ?? 0),
    failedCount: Number(failed?.n ?? 0),
  };
}

export const GIFT_STATUS_LABEL: Record<GiftCardStatus, string> = {
  created: "Ready",
  delivered: "Delivered",
  failed: "Failed",
  canceled: "Canceled",
};

// ── Webhook application ──────────────────────────────────────────────────────

/** Returns what happened so the route can log it. Never throws on unknown events. */
export async function applyWebhookEvent(evt: TremendousWebhookEvent): Promise<string> {
  const rewardId = evt.payload?.reward?.id ?? evt.payload?.resource?.id ?? null;
  const orderId = evt.payload?.order?.id ?? evt.payload?.reward?.order_id ?? null;
  const externalId = evt.payload?.order?.external_id ?? null;

  const row = await db.query.giftCards.findFirst({
    where: or(
      rewardId ? eq(giftCards.tremendousRewardId, rewardId) : sql`false`,
      orderId ? eq(giftCards.tremendousOrderId, orderId) : sql`false`,
      externalId ? eq(giftCards.externalId, externalId) : sql`false`,
    ),
  });
  if (!row) return "no_match";
  if (evt.uuid && row.lastWebhookUuid === evt.uuid) return "duplicate";

  const patch: Partial<typeof giftCards.$inferInsert> = {
    lastWebhookUuid: evt.uuid ?? row.lastWebhookUuid,
    updatedAt: new Date(),
  };
  switch (evt.event) {
    case "REWARDS.DELIVERY.SUCCEEDED":
      patch.status = "delivered";
      patch.deliveredAt = new Date();
      if (evt.payload?.reward?.delivery?.link) patch.redemptionLink = evt.payload.reward.delivery.link;
      break;
    case "REWARDS.DELIVERY.FAILED":
    case "ORDERS.FAILED":
      patch.status = "failed";
      patch.failureReason = evt.event;
      break;
    case "REWARDS.CANCELED":
    case "ORDERS.CANCELED":
      patch.status = "canceled";
      break;
    default:
      await db.update(giftCards).set(patch).where(eq(giftCards.id, row.id));
      return `ignored:${evt.event}`;
  }
  await db.update(giftCards).set(patch).where(eq(giftCards.id, row.id));
  return `applied:${evt.event}`;
}
