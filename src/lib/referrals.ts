import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  contacts,
  referralCampaigns,
  referralRewards,
  referrals,
  referrers,
  type ReferralStatus,
  type RewardStatus,
} from "@/db/schema";

/**
 * Build the absolute origin from the current request, e.g. https://example.com.
 * Falls back to NEXT_PUBLIC_APP_URL or http://localhost:3000.
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() throws outside a request context — fall through.
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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

/**
 * Returns the user's referrer row for the default active campaign,
 * creating it (and the underlying code) on first call. Idempotent.
 */
export async function getOrCreateReferrerForUser(localUserId: string) {
  // Default campaign = the first active campaign. Single-business MVP.
  const campaign = await db.query.referralCampaigns.findFirst({
    where: eq(referralCampaigns.isActive, true),
  });
  if (!campaign) {
    throw new Error(
      "No active referral campaign — run `pnpm db:seed` before continuing.",
    );
  }

  const existing = await db.query.referrers.findFirst({
    where: and(
      eq(referrers.userId, localUserId),
      eq(referrers.campaignId, campaign.id),
    ),
  });
  if (existing) return { referrer: existing, campaign };

  const origin = await getRequestOrigin();

  // Generate a unique code with a small retry loop on collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    try {
      const [created] = await db
        .insert(referrers)
        .values({
          userId: localUserId,
          campaignId: campaign.id,
          referralCode: code,
          referralLink: `${origin}/r/${code}`,
          source: "direct",
        })
        .returning();
      return { referrer: created, campaign };
    } catch (err) {
      // Postgres unique-violation — try a new code.
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
  throw new Error("Could not generate a unique referral code after 5 attempts");
}

export type ReferralStats = {
  pending: number;
  inProgress: number;
  completed: number;
  totalEarningsCents: number;
};

export async function getReferralStats(
  referrerId: string,
): Promise<ReferralStats> {
  const rows = await db
    .select({
      status: referrals.status,
      n: count(),
    })
    .from(referrals)
    .where(eq(referrals.referrerId, referrerId))
    .groupBy(referrals.status);

  const buckets: Record<ReferralStatus, number> = {
    pending: 0,
    clicked: 0,
    signed_up: 0,
    contacted: 0,
    hired: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const r of rows) buckets[r.status] += Number(r.n);

  const earningsRow = await db
    .select({
      total: sql<string>`COALESCE(SUM(${referrers.totalEarnings}), 0)`,
    })
    .from(referrers)
    .where(eq(referrers.id, referrerId));

  return {
    pending: buckets.pending + buckets.clicked + buckets.signed_up,
    inProgress: buckets.contacted + buckets.hired,
    completed: buckets.completed,
    totalEarningsCents: Math.round(
      Number(earningsRow[0]?.total ?? "0") * 100,
    ),
  };
}

export type ReferralRowForList = {
  id: string;
  status: ReferralStatus;
  createdAt: Date;
  referredName: string;
  referredEmail: string | null;
  referredPhone: string | null;
};

export async function listReferralsForReferrer(
  referrerId: string,
  limit = 25,
): Promise<ReferralRowForList[]> {
  const rows = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      createdAt: referrals.createdAt,
      referredName: contacts.name,
      referredEmail: contacts.email,
      referredPhone: contacts.phone,
    })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, status: r.status as ReferralStatus }));
}

/**
 * Server-action target: create a Contact + Referral pair for the given referrer.
 * Returns the new referral id. Throws on validation failure.
 */
export async function createManualReferral(args: {
  referrerLocalUserId: string;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
}) {
  const { referrer, campaign } = await getOrCreateReferrerForUser(
    args.referrerLocalUserId,
  );
  if (!campaign.businessId) {
    throw new Error("Default campaign has no business attached");
  }

  // Upsert contact by (business, email|phone).
  let contact = args.email
    ? await db.query.contacts.findFirst({
        where: and(
          eq(contacts.businessId, campaign.businessId),
          eq(contacts.email, args.email),
        ),
      })
    : null;
  if (!contact && args.phone) {
    contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.businessId, campaign.businessId),
        eq(contacts.phone, args.phone),
      ),
    });
  }
  if (!contact) {
    const [created] = await db
      .insert(contacts)
      .values({
        businessId: campaign.businessId,
        name: args.name,
        email: args.email ?? null,
        phone: args.phone ?? null,
        source: "referral",
        notes: args.note ?? null,
      })
      .returning();
    contact = created;
  }

  const [created] = await db
    .insert(referrals)
    .values({
      referrerId: referrer.id,
      campaignId: campaign.id,
      referredContactId: contact.id,
      status: "pending",
      referrerNote: args.note ?? null,
      source: "manual",
    })
    .returning();

  return { referralId: created.id };
}

export const REFERRAL_STATUSES_FOR_DISPLAY: Record<ReferralStatus, string> = {
  pending: "New",
  clicked: "Clicked link",
  signed_up: "Signed up",
  contacted: "Contacted",
  hired: "Hired",
  completed: "Completed",
  rejected: "Not a fit",
  cancelled: "Cancelled",
};

void inArray; // reserved for filtered queries in later phases

// ── Rewards (claim flow) ─────────────────────────────────────────────────────

export type ClaimableReward = {
  id: string;
  amount: string;
  status: RewardStatus;
  paymentMethod: string | null;
  referredName: string;
  createdAt: Date;
};

/** Rewards the referrer can still pick a payout for (pending) plus in-flight ones. */
export async function listRewardsForReferrer(
  referrerId: string,
): Promise<ClaimableReward[]> {
  const rows = await db
    .select({
      id: referralRewards.id,
      amount: referralRewards.amount,
      status: referralRewards.status,
      paymentMethod: referralRewards.paymentMethod,
      referredName: contacts.name,
      createdAt: referralRewards.createdAt,
    })
    .from(referralRewards)
    .innerJoin(referrals, eq(referralRewards.referralId, referrals.id))
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .where(eq(referralRewards.referrerId, referrerId))
    .orderBy(desc(referralRewards.createdAt));
  return rows.map((r) => ({ ...r, status: r.status as RewardStatus }));
}

/** Customer chose how they want a pending reward paid. */
export async function claimReward(args: {
  rewardId: string;
  referrerId: string;
  paymentMethod: string;
  paymentDetails?: string;
}) {
  const [updated] = await db
    .update(referralRewards)
    .set({
      paymentMethod: args.paymentMethod,
      paymentDetails: args.paymentDetails ?? null,
      status: "processing",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(referralRewards.id, args.rewardId),
        eq(referralRewards.referrerId, args.referrerId),
        eq(referralRewards.status, "pending"),
      ),
    )
    .returning();
  return updated ?? null;
}

/** Optional "friend gets X off" copy stored on campaign.settings.friendOffer. */
export function friendOfferFor(campaign: { settings: Record<string, unknown> | null }) {
  const v = campaign.settings?.friendOffer;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
