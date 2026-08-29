import { and, count, eq, gte, or, sql } from "drizzle-orm";

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
  listCampaignProducts,
  type GiftProduct,
  type TremendousWebhookEvent,
} from "@/lib/tremendous";
import { emitRequestEvent } from "@/lib/reviews";

export type GiftCardRow = typeof giftCards.$inferSelect;

function errorReason(err: unknown): string {
  if (err instanceof TremendousError) {
    return err.status ? `tremendous_${err.status}: ${err.message}` : err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Flow: a gift is *offered* when the review request is created (ledger row,
 * no Tremendous call). The customer picks a product in the funnel; that
 * choice creates the Tremendous order (`products: [id]`, LINK delivery) and
 * the row becomes *created* with a redemption link. Idempotent per row via
 * external_id, so a retry of a failed order can never double-pay.
 */

/** Offer the unconditional thank-you gift for a review request (no API call). */
export async function issueGiftForReviewRequest(requestId: string): Promise<GiftCardRow | null> {
  const req = await db.query.reviewRequests.findFirst({
    where: eq(reviewRequests.id, requestId),
    with: { business: true, giftCard: true },
  });
  if (!req) return null;
  if (req.giftCard) return req.giftCard;

  const amount = Number(req.business.giftAmount);
  if (!(amount > 0)) return null; // gifts disabled for this business

  const [inserted] = await db
    .insert(giftCards)
    .values({
      businessId: req.businessId,
      contactId: req.contactId,
      reviewRequestId: req.id,
      source: "review_request",
      amount: req.business.giftAmount,
      currencyCode: "USD",
      status: "offered",
      externalId: `rr-${req.id}`,
      campaignId: req.business.tremendousCampaignId,
    })
    .onConflictDoNothing({ target: giftCards.reviewRequestId })
    .returning();
  return (
    inserted ??
    (await db.query.giftCards.findFirst({ where: eq(giftCards.reviewRequestId, req.id) })) ??
    null
  );
}

/** Products this gift can be redeemed as (from the business's campaign). */
export async function productsForGift(row: Pick<GiftCardRow, "campaignId" | "amount">): Promise<GiftProduct[]> {
  if (!row.campaignId || !isTremendousConfigured()) return [];
  try {
    return await listCampaignProducts(row.campaignId, Number(row.amount));
  } catch (err) {
    console.error("listCampaignProducts failed", err);
    return [];
  }
}

/**
 * Customer picked a product → create the Tremendous order. Returns the row
 * with a redemption link on success; a `failed` row (with reason) otherwise.
 */
export async function claimGift(giftId: string, productId: string): Promise<GiftCardRow | null> {
  const row = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, giftId),
    with: { contact: true },
  });
  if (!row) return null;
  // Already ordered — return as-is (never create a second order).
  if (row.status === "created" || row.status === "delivered") return row;
  if (row.status === "canceled") return row;

  const products = await productsForGift(row);
  const product = products.find((p) => p.id === productId);
  if (!product) {
    const [updated] = await db
      .update(giftCards)
      .set({ status: "failed", failureReason: "invalid_product", updatedAt: new Date() })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }

  if (!isTremendousConfigured()) {
    const [updated] = await db
      .update(giftCards)
      .set({
        status: "failed",
        productId,
        productName: product.name,
        failureReason: "not_configured",
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }

  try {
    const created = await createLinkReward({
      externalId: row.externalId,
      amount: Number(row.amount),
      currency: row.currencyCode,
      recipientName: row.contact.name,
      recipientEmail: row.contact.email,
      productIds: [productId],
    });
    const [updated] = await db
      .update(giftCards)
      .set({
        status: "created",
        productId,
        productName: product.name,
        tremendousOrderId: created.orderId,
        tremendousRewardId: created.rewardId,
        redemptionLink: created.link,
        failureReason: null,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, row.id))
      .returning();
    await emitRequestEvent(row.reviewRequestId, "gift.claimed", {
      giftId: row.id,
      product: product.name,
      productId,
      amount: Number(row.amount),
      redemptionLink: created.link,
      tremendousOrderId: created.orderId,
    });
    return updated;
  } catch (err) {
    console.error("Tremendous order failed", row.externalId, err);
    const [updated] = await db
      .update(giftCards)
      .set({
        status: "failed",
        productId,
        productName: product.name,
        failureReason: errorReason(err).slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }
}

/** Staff retry of a failed order (re-uses the product the customer picked). */
export async function retryGift(giftId: string) {
  const row = await db.query.giftCards.findFirst({ where: eq(giftCards.id, giftId) });
  if (!row) return null;
  if (row.status !== "failed") return row;
  if (!row.productId) {
    // Nothing was picked yet — put it back on offer so the customer can choose.
    const [updated] = await db
      .update(giftCards)
      .set({ status: "offered", failureReason: null, updatedAt: new Date() })
      .where(eq(giftCards.id, row.id))
      .returning();
    return updated;
  }
  return claimGift(row.id, row.productId);
}

/** One-off gift from the contact page — offered, customer picks via their review link. */
export async function issueManualGift(args: { contactId: string; amount?: number }) {
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
      source: "manual",
      amount: amount.toFixed(2),
      currencyCode: "USD",
      status: "offered",
      externalId: `manual-${crypto.randomUUID()}`,
      campaignId: contact.business.tremendousCampaignId,
    })
    .returning();
  return row;
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

export async function giftStats() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [ordered] = await db
    .select({ n: count(), total: sql<string>`COALESCE(SUM(${giftCards.amount}), 0)` })
    .from(giftCards)
    .where(
      and(
        gte(giftCards.createdAt, monthStart),
        or(eq(giftCards.status, "created"), eq(giftCards.status, "delivered")),
      ),
    );
  const [offered] = await db
    .select({ n: count() })
    .from(giftCards)
    .where(eq(giftCards.status, "offered"));
  const [failed] = await db
    .select({ n: count() })
    .from(giftCards)
    .where(eq(giftCards.status, "failed"));
  return {
    monthCount: Number(ordered?.n ?? 0),
    monthTotal: Number(ordered?.total ?? 0),
    offeredCount: Number(offered?.n ?? 0),
    failedCount: Number(failed?.n ?? 0),
  };
}

export const GIFT_STATUS_LABEL: Record<GiftCardStatus, string> = {
  offered: "Offered",
  created: "Ordered",
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

void businesses;
