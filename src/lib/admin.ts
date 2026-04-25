import { auth } from "@clerk/nextjs/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  communicationLogs,
  contacts,
  referralCampaigns,
  referrals,
  referrers,
  users,
  type ReferralStatus,
} from "@/db/schema";
import { ensureCurrentUser } from "@/lib/users";

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  if (role !== "admin" && role !== "staff") redirect("/dashboard");
  return ensureCurrentUser();
}

export type AdminReferralRow = {
  id: string;
  status: ReferralStatus;
  createdAt: Date;
  referredName: string;
  referredEmail: string | null;
  referredPhone: string | null;
  referrerName: string | null;
  referrerEmail: string;
  campaignName: string;
  businessName: string | null;
};

export async function listAllReferrals(
  limit = 100,
): Promise<AdminReferralRow[]> {
  const rows = await db
    .select({
      id: referrals.id,
      status: referrals.status,
      createdAt: referrals.createdAt,
      referredName: contacts.name,
      referredEmail: contacts.email,
      referredPhone: contacts.phone,
      referrerName: users.name,
      referrerEmail: users.email,
      campaignName: referralCampaigns.name,
      businessName: sql<string | null>`'TBD'`, // joined below
    })
    .from(referrals)
    .innerJoin(contacts, eq(referrals.referredContactId, contacts.id))
    .innerJoin(referrers, eq(referrals.referrerId, referrers.id))
    .innerJoin(users, eq(referrers.userId, users.id))
    .innerJoin(
      referralCampaigns,
      eq(referrals.campaignId, referralCampaigns.id),
    )
    .orderBy(desc(referrals.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    status: r.status as ReferralStatus,
    businessName: null,
  }));
}

export async function getReferralDetail(referralId: string) {
  const row = await db.query.referrals.findFirst({
    where: eq(referrals.id, referralId),
    with: {
      referrer: { with: { user: true } },
      campaign: { with: { business: true } },
      referredContact: true,
    },
  });
  if (!row) return null;
  return row;
}

export type AdminContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  businessName: string;
  createdAt: Date;
  referralCount: number;
};

export async function listAllContacts(
  limit = 100,
): Promise<AdminContactRow[]> {
  const referralCounts = db
    .select({
      contactId: referrals.referredContactId,
      n: count().as("n"),
    })
    .from(referrals)
    .groupBy(referrals.referredContactId)
    .as("rc");

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      phone: contacts.phone,
      source: contacts.source,
      businessName: sql<string>`b.name`.as("business_name"),
      createdAt: contacts.createdAt,
      referralCount: sql<number>`COALESCE(${referralCounts.n}, 0)`.as(
        "referral_count",
      ),
    })
    .from(contacts)
    .innerJoin(sql.raw(`businesses b`), sql`b.id = ${contacts.businessId}`)
    .leftJoin(referralCounts, eq(referralCounts.contactId, contacts.id))
    .orderBy(desc(contacts.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    referralCount: Number(r.referralCount ?? 0),
  }));
}

export async function getContactDetail(contactId: string) {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId),
    with: { business: true, owner: true, linkedUser: true },
  });
  if (!contact) return null;

  const [contactReferrals, comms] = await Promise.all([
    db.query.referrals.findMany({
      where: eq(referrals.referredContactId, contactId),
      with: { referrer: { with: { user: true } }, campaign: true },
      orderBy: desc(referrals.createdAt),
    }),
    db.query.communicationLogs.findMany({
      where: eq(communicationLogs.contactId, contactId),
      with: { user: true },
      orderBy: desc(communicationLogs.occurredAt),
      limit: 50,
    }),
  ]);

  return { contact, referrals: contactReferrals, comms };
}

export async function getAdminStats() {
  const [totalRefs, completedRefs, totalContacts] = await Promise.all([
    db.select({ n: count() }).from(referrals),
    db
      .select({ n: count() })
      .from(referrals)
      .where(eq(referrals.status, "completed")),
    db.select({ n: count() }).from(contacts),
  ]);

  return {
    totalReferrals: Number(totalRefs[0]?.n ?? 0),
    completedReferrals: Number(completedRefs[0]?.n ?? 0),
    totalContacts: Number(totalContacts[0]?.n ?? 0),
  };
}

void and; // reserved for filtered queries
