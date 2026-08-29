import { and, count, desc, eq, inArray, isNull, notInArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  contacts,
  giftCards,
  referralCampaigns,
  referralRewards,
  referrals,
  referrers,
  users,
  type ReferralStatus,
  type RewardStatus,
} from "@/db/schema";
import { emitEvent } from "@/lib/events";
import { isSmsConfigured, sendSms } from "@/lib/notify";

/** Public origin for links we hand out. Always the configured app URL, never the request host. */
export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Kept for callers that need the live request origin (admin previews). */
export async function getRequestOrigin(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // outside a request
  }
  return appOrigin();
}

export function referralLinkFor(code: string) {
  return `${appOrigin()}/r/${code}`;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
const CODE_LENGTH = 8;

function generateReferralCode() {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** The one campaign the program runs on: active, attached to an active business, stable order. */
export async function getActiveCampaign() {
  const rows = await db
    .select({ campaign: referralCampaigns })
    .from(referralCampaigns)
    .innerJoin(
      sql`businesses b`,
      sql`b.id = ${referralCampaigns.businessId} AND b.is_active = true`,
    )
    .where(eq(referralCampaigns.isActive, true))
    .orderBy(sql`b.sort_order`, referralCampaigns.createdAt)
    .limit(1);
  return rows[0]?.campaign ?? null;
}

/**
 * Returns the user's referrer row for the active campaign, creating it (and
 * the code) on first call. Returns null when the program is paused.
 */
export async function getOrCreateReferrerForUser(localUserId: string) {
  const campaign = await getActiveCampaign();
  if (!campaign) return null;

  const existing = await db.query.referrers.findFirst({
    where: and(eq(referrers.userId, localUserId), eq(referrers.campaignId, campaign.id)),
  });
  if (existing) return { referrer: { ...existing, referralLink: referralLinkFor(existing.referralCode) }, campaign };

  // A contact-level code may already exist for this person (minted with a
  // review request before they had an account) — adopt it, don't mint a second.
  const user = await db.query.users.findFirst({ where: eq(users.id, localUserId) });
  if (user && campaign.businessId) {
    const conds = [eq(contacts.linkedUserId, localUserId)];
    if (user.email && !user.email.endsWith("@no-email.local")) conds.push(eq(contacts.email, user.email.toLowerCase()));
    if (user.phone) conds.push(sql`regexp_replace(${contacts.phone}, '\\D', '', 'g') LIKE ${"%" + user.phone.replace(/\D/g, "").slice(-10)}`);
    const orphan = await db
      .select({ r: referrers })
      .from(referrers)
      .innerJoin(contacts, eq(referrers.contactId, contacts.id))
      .where(and(eq(referrers.campaignId, campaign.id), isNull(referrers.userId), eq(contacts.businessId, campaign.businessId), or(...conds)))
      .limit(1);
    if (orphan[0]) {
      const [adopted] = await db
        .update(referrers)
        .set({ userId: localUserId, updatedAt: new Date() })
        .where(eq(referrers.id, orphan[0].r.id))
        .returning();
      await db.update(contacts).set({ linkedUserId: localUserId }).where(and(eq(contacts.id, adopted.contactId!), isNull(contacts.linkedUserId)));
      return { referrer: { ...adopted, referralLink: referralLinkFor(adopted.referralCode) }, campaign };
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    try {
      const [created] = await db
        .insert(referrers)
        .values({
          userId: localUserId,
          campaignId: campaign.id,
          referralCode: code,
          referralLink: referralLinkFor(code),
          source: "direct",
        })
        .returning();
      return { referrer: created, campaign };
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") continue;
      throw err;
    }
  }
  throw new Error("Could not generate a unique referral code after 5 attempts");
}

/**
 * Referral code for a contact who may not have an account (review-request
 * recipients). Reuses the user's code if the contact is linked to a user.
 */
export async function getOrCreateReferrerForContact(contactId: string) {
  const campaign = await getActiveCampaign();
  if (!campaign) return null;
  const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, contactId) });
  if (!contact) return null;
  if (contact.linkedUserId) {
    const got = await getOrCreateReferrerForUser(contact.linkedUserId);
    if (got) return got;
  }
  const existing = await db.query.referrers.findFirst({
    where: and(eq(referrers.contactId, contactId), eq(referrers.campaignId, campaign.id)),
  });
  if (existing) return { referrer: { ...existing, referralLink: referralLinkFor(existing.referralCode) }, campaign };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    try {
      const [created] = await db
        .insert(referrers)
        .values({ contactId, campaignId: campaign.id, referralCode: code, referralLink: referralLinkFor(code), source: "review_request" })
        .returning();
      return { referrer: created, campaign };
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") continue;
      throw err;
    }
  }
  return null;
}

/** Who owns a referrer row: the signed-in user, else the contact it was minted for. */
export async function referrerIdentity(referrerId: string) {
  const r = await db.query.referrers.findFirst({
    where: eq(referrers.id, referrerId),
    with: { user: true, contact: true },
  });
  if (!r) return null;
  return {
    name: r.user?.name ?? r.contact?.name ?? null,
    phone: r.user?.phone ?? r.contact?.phone ?? null,
    email: (r.user?.email && !r.user.email.endsWith("@no-email.local") ? r.user.email : null) ?? r.contact?.email ?? null,
    userId: r.userId,
    contactId: r.contactId,
    externalRefs: r.contact?.externalRefs ?? null,
  };
}

// ── Attribution (the one place a referral gets created) ─────────────────────

export type AttributeInput = {
  code: string;
  /** The referred person. Existing contact by id, or identity to upsert. */
  contact:
    | { id: string }
    | { name: string; phone?: string | null; email?: string | null; linkedUserId?: string | null };
  source: "cookie" | "booking" | "manual" | "servicetitan";
  status?: Extract<ReferralStatus, "pending" | "clicked" | "signed_up" | "contacted" | "hired">;
  note?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export type AttributeResult =
  | { ok: true; referral: typeof referrals.$inferSelect; contactId: string; existing: boolean; referrerUserId: string; referrerId: string }
  | { ok: false; reason: "unknown_code" | "self_referral" | "no_business" | "invalid_contact" };

function norm(v: string | null | undefined) {
  return (v ?? "").trim().toLowerCase();
}
function digits(v: string | null | undefined) {
  return (v ?? "").replace(/\D/g, "").slice(-10);
}

export async function attributeReferral(input: AttributeInput): Promise<AttributeResult> {
  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralCode, input.code.trim().toUpperCase()),
    with: { user: true, contact: true, campaign: true },
  });
  if (!referrer) return { ok: false, reason: "unknown_code" };
  const businessId = referrer.campaign.businessId;
  if (!businessId) return { ok: false, reason: "no_business" };

  // Resolve / upsert the referred contact.
  let contact: typeof contacts.$inferSelect | undefined;
  if ("id" in input.contact) {
    contact = await db.query.contacts.findFirst({ where: eq(contacts.id, input.contact.id) });
    if (!contact) return { ok: false, reason: "invalid_contact" };
  } else {
    const c = input.contact;
    const phone = c.phone?.trim() || null;
    const email = c.email?.trim().toLowerCase() || null;
    if (!phone && !email && !c.linkedUserId) return { ok: false, reason: "invalid_contact" };
    if (email) {
      contact = await db.query.contacts.findFirst({
        where: and(eq(contacts.businessId, businessId), eq(contacts.email, email)),
      });
    }
    if (!contact && phone) {
      contact = await db.query.contacts.findFirst({
        where: and(eq(contacts.businessId, businessId), eq(contacts.phone, phone)),
      });
    }
    if (!contact && c.linkedUserId) {
      contact = await db.query.contacts.findFirst({
        where: and(eq(contacts.businessId, businessId), eq(contacts.linkedUserId, c.linkedUserId)),
      });
    }
    if (!contact) {
      const [created] = await db
        .insert(contacts)
        .values({
          businessId,
          name: c.name.trim() || phone || email || "Referred customer",
          phone,
          email,
          linkedUserId: c.linkedUserId ?? null,
          source: "referral",
          notes: input.note ?? null,
        })
        .returning();
      contact = created;
    } else if (c.linkedUserId && !contact.linkedUserId) {
      await db.update(contacts).set({ linkedUserId: c.linkedUserId, updatedAt: new Date() }).where(eq(contacts.id, contact.id));
    }
  }

  // Self-referral guard: same user/contact, or same phone/email as the referrer.
  const ownerEmail = referrer.user?.email ?? referrer.contact?.email ?? null;
  const ownerPhone = referrer.user?.phone ?? referrer.contact?.phone ?? null;
  if (
    (referrer.userId && contact.linkedUserId && contact.linkedUserId === referrer.userId) ||
    (referrer.contactId && contact.id === referrer.contactId) ||
    (contact.email && ownerEmail && norm(contact.email) === norm(ownerEmail)) ||
    (contact.phone && ownerPhone && digits(contact.phone) === digits(ownerPhone))
  ) {
    return { ok: false, reason: "self_referral" };
  }

  // One live referral per friend per campaign.
  const live = await db.query.referrals.findFirst({
    where: and(
      eq(referrals.campaignId, referrer.campaignId),
      eq(referrals.referredContactId, contact.id),
      notInArray(referrals.status, ["rejected", "cancelled"]),
    ),
  });
  if (live) {
    return { ok: true, referral: live, contactId: contact.id, existing: true, referrerUserId: referrer.userId ?? "" , referrerId: referrer.id };
  }

  const status = input.status ?? "pending";
  const now = new Date();
  const [created] = await db
    .insert(referrals)
    .values({
      referrerId: referrer.id,
      campaignId: referrer.campaignId,
      referredContactId: contact.id,
      referredUserId: contact.linkedUserId ?? null,
      status,
      referrerNote: input.note ?? null,
      source: input.source,
      ipAddress: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
      clickedAt: now,
      signedUpAt: status === "signed_up" ? now : null,
      contactedAt: status === "contacted" || status === "hired" ? now : null,
      hiredAt: status === "hired" ? now : null,
    })
    .onConflictDoNothing()
    .returning();
  if (!created) {
    const again = await db.query.referrals.findFirst({
      where: and(eq(referrals.campaignId, referrer.campaignId), eq(referrals.referredContactId, contact.id)),
      orderBy: desc(referrals.createdAt),
    });
    return { ok: true, referral: again!, contactId: contact.id, existing: true, referrerUserId: referrer.userId ?? "", referrerId: referrer.id };
  }
  await db
    .update(referrers)
    .set({ totalReferrals: sql`${referrers.totalReferrals} + 1`, updatedAt: now })
    .where(eq(referrers.id, referrer.id));
  emitReferralEvent(created.id, "referral.attributed", { source: input.source, status });
  return { ok: true, referral: created, contactId: contact.id, existing: false, referrerUserId: referrer.userId ?? "", referrerId: referrer.id };
}

// ── Status transitions ───────────────────────────────────────────────────────

const STAMP: Partial<Record<ReferralStatus, "signedUpAt" | "contactedAt" | "hiredAt" | "convertedAt" | "rejectedAt">> = {
  signed_up: "signedUpAt",
  contacted: "contactedAt",
  hired: "hiredAt",
  completed: "convertedAt",
  rejected: "rejectedAt",
};
const RANK: Record<ReferralStatus, number> = {
  pending: 0, clicked: 1, signed_up: 2, contacted: 3, hired: 4, completed: 5, rejected: 9, cancelled: 9,
};

/** Advance a referral (never regress a completed one). */
export async function setReferralStatus(referralId: string, status: ReferralStatus, meta?: Record<string, unknown>) {
  const row = await db.query.referrals.findFirst({ where: eq(referrals.id, referralId) });
  if (!row) return null;
  if (row.status === "completed" && status !== "completed") return row;
  const patch: Record<string, unknown> = { status, updatedAt: new Date() };
  const stamp = STAMP[status];
  if (stamp && !row[stamp]) patch[stamp] = new Date();
  if (meta) patch.metadata = { ...(row.metadata ?? {}), ...meta };
  const [updated] = await db.update(referrals).set(patch).where(eq(referrals.id, referralId)).returning();
  if (RANK[status] > RANK[row.status]) emitReferralEvent(referralId, "referral.status", { status });
  return updated;
}

/**
 * The referred friend's job is done (and paid). Idempotent: completes the
 * referral, creates the pending reward, updates the referrer's totals, and
 * tells the referrer to come pick a gift card.
 */
/** A referral only pays when the friend's job was more than a dispatch/diagnostic visit. */
export const REFERRAL_MIN_INVOICE = Number(process.env.REFERRAL_MIN_INVOICE ?? 89);

export async function completeReferral(args: {
  referralId: string;
  source: "servicetitan" | "admin" | "poller";
  stJobId?: string | null;
  invoiceTotal?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const row = await db.query.referrals.findFirst({
    where: eq(referrals.id, args.referralId),
    with: { referrer: true, campaign: true },
  });
  if (!row) return { ok: false as const, reason: "not_found" };

  // Automated sources must prove the job was real work (> $89 dispatch fee).
  // Admin completion is the manual override and skips this check.
  if (args.source !== "admin") {
    const total = args.invoiceTotal;
    if (total == null || !(total > REFERRAL_MIN_INVOICE)) {
      await setReferralStatus(row.id, "hired", {
        last_job_id: args.stJobId ?? null,
        last_invoice_total: total ?? null,
        below_minimum: true,
      });
      return { ok: false as const, reason: "below_minimum" };
    }
  }
  const existingReward = await db.query.referralRewards.findFirst({ where: eq(referralRewards.referralId, row.id) });
  if (row.status === "completed" && existingReward) return { ok: true as const, reward: existingReward, already: true };

  const now = new Date();
  await db
    .update(referrals)
    .set({
      status: "completed",
      convertedAt: row.convertedAt ?? now,
      rewardedAt: now,
      hiredAt: row.hiredAt ?? now,
      updatedAt: now,
      metadata: { ...(row.metadata ?? {}), ...(args.metadata ?? {}), completed_by: args.source, st_job_id: args.stJobId ?? (row.metadata as Record<string, unknown> | null)?.st_job_id, invoice_total: args.invoiceTotal ?? undefined },
    })
    .where(eq(referrals.id, row.id));

  let reward = existingReward;
  if (!reward) {
    [reward] = await db
      .insert(referralRewards)
      .values({
        referrerId: row.referrerId,
        referralId: row.id,
        amount: row.campaign.rewardAmount,
        type: row.campaign.rewardType,
        status: "pending",
      })
      .returning();
    await db
      .update(referrers)
      .set({
        convertedReferrals: sql`${referrers.convertedReferrals} + 1`,
        totalEarnings: sql`${referrers.totalEarnings} + ${row.campaign.rewardAmount}`,
        updatedAt: now,
      })
      .where(eq(referrers.id, row.referrerId));
  }

  emitReferralEvent(row.id, "referral.completed", { rewardId: reward.id, amount: Number(reward.amount), source: args.source });

  const who = await referrerIdentity(row.referrerId);
  const phone = who?.phone ?? null;
  if (phone && isSmsConfigured()) {
    const amount = Math.round(Number(reward.amount));
    await sendSms(
      phone,
      `Great news from Perfect Catch — the friend you referred just finished their job. Your $${amount} thank-you is ready: ${appOrigin()}/dashboard`,
    );
  }
  return { ok: true as const, reward, already: false };
}

// ── Stats / lists for the dashboard ──────────────────────────────────────────

export type ReferralStats = { pending: number; inProgress: number; completed: number; totalEarningsCents: number };

export async function getReferralStats(referrerId: string): Promise<ReferralStats> {
  const rows = await db
    .select({ status: referrals.status, n: count() })
    .from(referrals)
    .where(eq(referrals.referrerId, referrerId))
    .groupBy(referrals.status);
  const b: Record<ReferralStatus, number> = { pending: 0, clicked: 0, signed_up: 0, contacted: 0, hired: 0, completed: 0, rejected: 0, cancelled: 0 };
  for (const r of rows) b[r.status] += Number(r.n);
  const [e] = await db
    .select({ total: sql<string>`COALESCE(SUM(${referrers.totalEarnings}), 0)` })
    .from(referrers)
    .where(eq(referrers.id, referrerId));
  return {
    pending: b.pending + b.clicked + b.signed_up,
    inProgress: b.contacted + b.hired,
    completed: b.completed,
    totalEarningsCents: Math.round(Number(e?.total ?? "0") * 100),
  };
}

export type ReferralRowForList = {
  id: string;
  status: ReferralStatus;
  createdAt: Date;
  referredName: string;
  referredEmail: string | null;
  referredPhone: string | null;
  booked: boolean;
};

export async function listReferralsForReferrer(referrerId: string, limit = 25): Promise<ReferralRowForList[]> {
  const rows = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      createdAt: referrals.createdAt,
      referredName: contacts.name,
      referredEmail: contacts.email,
      referredPhone: contacts.phone,
      metadata: referrals.metadata,
    })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt))
    .limit(limit);
  return rows.map(({ metadata, ...r }) => ({
    ...r,
    status: r.status as ReferralStatus,
    booked: Boolean((metadata as Record<string, unknown> | null)?.st_lead_id),
  }));
}

/** Customer-submitted referral by name/phone/email (dashboard form). */
export async function createManualReferral(args: {
  referrerLocalUserId: string;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
}) {
  const got = await getOrCreateReferrerForUser(args.referrerLocalUserId);
  if (!got) throw new Error("Referral program is paused");
  const res = await attributeReferral({
    code: got.referrer.referralCode,
    contact: { name: args.name, email: args.email ?? null, phone: args.phone ?? null },
    source: "manual",
    status: "pending",
    note: args.note ?? null,
  });
  if (!res.ok) throw new Error(res.reason === "self_referral" ? "You can't refer yourself." : "Could not save that referral.");
  return { referralId: res.referral.id, existing: res.existing };
}

export const REFERRAL_STATUSES_FOR_DISPLAY: Record<ReferralStatus, string> = {
  pending: "New",
  clicked: "Clicked link",
  signed_up: "Signed up",
  contacted: "Booked",
  hired: "Job scheduled",
  completed: "Completed",
  rejected: "Not a fit",
  cancelled: "Cancelled",
};

// ── Rewards (claim flow) ─────────────────────────────────────────────────────

export type ClaimableReward = {
  id: string;
  amount: string;
  status: RewardStatus;
  paymentMethod: string | null;
  paymentReference: string | null;
  referredName: string;
  createdAt: Date;
  giftId: string | null;
  giftStatus: string | null;
  giftProduct: string | null;
  giftLink: string | null;
};

export async function listRewardsForReferrer(referrerId: string): Promise<ClaimableReward[]> {
  const rows = await db
    .select({
      id: referralRewards.id,
      amount: referralRewards.amount,
      status: referralRewards.status,
      paymentMethod: referralRewards.paymentMethod,
      paymentReference: referralRewards.paymentReference,
      referredName: contacts.name,
      createdAt: referralRewards.createdAt,
      giftId: giftCards.id,
      giftStatus: giftCards.status,
      giftProduct: giftCards.productName,
      giftLink: giftCards.redemptionLink,
    })
    .from(referralRewards)
    .innerJoin(referrals, eq(referralRewards.referralId, referrals.id))
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .leftJoin(giftCards, eq(giftCards.externalId, sql`'reward-' || ${referralRewards.id}::text`))
    .where(eq(referralRewards.referrerId, referrerId))
    .orderBy(desc(referralRewards.createdAt));
  return rows.map((r) => ({ ...r, status: r.status as RewardStatus }));
}

/**
 * Referrer picked a gift card for a pending reward → create the gift ledger
 * row (external id `reward-<id>`) and place the Tremendous order. Returns the
 * gift row; `referral_rewards` mirrors its outcome.
 */
export async function claimRewardAsGift(args: { rewardId: string; referrerId: string; productId: string }) {
  const reward = await db.query.referralRewards.findFirst({
    where: and(eq(referralRewards.id, args.rewardId), eq(referralRewards.referrerId, args.referrerId)),
    with: { referrer: { with: { campaign: { with: { business: true } } } } },
  });
  if (!reward) return null;
  const business = reward.referrer.campaign.business;
  if (!business) return null;
  const who = await referrerIdentity(reward.referrerId);
  if (!who) return null;

  // Referrer as a contact (for the gift ledger + Tremendous recipient).
  let contact =
    (who.contactId ? await db.query.contacts.findFirst({ where: eq(contacts.id, who.contactId) }) : undefined) ??
    (who.userId ? await db.query.contacts.findFirst({ where: and(eq(contacts.businessId, business.id), eq(contacts.linkedUserId, who.userId)) }) : undefined) ??
    (who.email ? await db.query.contacts.findFirst({ where: and(eq(contacts.businessId, business.id), eq(contacts.email, who.email)) }) : undefined) ??
    (who.phone ? await db.query.contacts.findFirst({ where: and(eq(contacts.businessId, business.id), eq(contacts.phone, who.phone)) }) : undefined);
  if (!contact) {
    const [c] = await db
      .insert(contacts)
      .values({
        businessId: business.id,
        linkedUserId: who.userId,
        name: who.name ?? who.phone ?? "Referrer",
        email: who.email,
        phone: who.phone,
        source: "referral",
      })
      .returning();
    contact = c;
  }

  const externalId = `reward-${reward.id}`;
  let gift = await db.query.giftCards.findFirst({ where: eq(giftCards.externalId, externalId) });
  if (!gift) {
    [gift] = await db
      .insert(giftCards)
      .values({
        businessId: business.id,
        contactId: contact.id,
        source: "referral",
        amount: reward.amount,
        currencyCode: "USD",
        status: "offered",
        externalId,
        campaignId: business.tremendousCampaignId,
      })
      .returning();
  }
  const { claimGift } = await import("@/lib/gifts");
  const result = await claimGift(gift.id, args.productId);
  const ok = result && (result.status === "created" || result.status === "delivered");
  await db
    .update(referralRewards)
    .set({
      status: ok ? "issued" : "failed",
      paymentMethod: ok ? `gift_card:${result?.productName ?? args.productId}` : reward.paymentMethod,
      paymentReference: gift.id,
      failureReason: ok ? null : (result?.failureReason ?? "gift_failed"),
      sentAt: ok ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(referralRewards.id, reward.id));
  return result;
}

/** Optional "friend gets X off" copy stored on campaign.settings.friendOffer. */
export function friendOfferFor(campaign: { settings: Record<string, unknown> | null }) {
  const v = campaign.settings?.friendOffer;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// ── Events ───────────────────────────────────────────────────────────────────

export async function emitReferralEvent(referralId: string, type: "referral.attributed" | "referral.status" | "referral.completed" | "booking.created", data: Record<string, unknown>) {
  if (!process.env.OUTBOUND_EVENTS_URL) return;
  try {
    const row = await db.query.referrals.findFirst({
      where: eq(referrals.id, referralId),
      with: { referredContact: true, campaign: { with: { business: true } }, referrer: true },
    });
    if (!row) return;
    const who = await referrerIdentity(row.referrerId);
    emitEvent({
      type,
      business: row.campaign.business?.slug ?? "perfect-catch-electric",
      requestId: row.id,
      token: null,
      contactId: row.referredContactId,
      externalRefs: row.referredContact.externalRefs ?? null,
      metadata: {
        ...(row.metadata ?? {}),
        referral_code: row.referrer.referralCode,
        referrer_name: who?.name ?? null,
        referrer_phone: who?.phone ?? null,
        referrer_email: who?.email ?? null,
        referrer_contact_id: who?.contactId ?? null,
        referrer_external_refs: who?.externalRefs ?? null,
      },
      data,
    });
  } catch (err) {
    console.error("emitReferralEvent failed", type, err);
  }
}

// Open referrals that can still be matched to a completed job.
export const OPEN_REFERRAL_STATUSES: ReferralStatus[] = ["pending", "clicked", "signed_up", "contacted", "hired"];
void inArray;
