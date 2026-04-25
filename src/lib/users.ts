import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { contacts, referrals, referrers, users } from "@/db/schema";

const REFERRAL_COOKIE = "lazi_ref";

/**
 * Ensure a shadow `users` row exists for the current authenticated Clerk user.
 *
 * Lazy-provisions the row on first dashboard hit so we don't need a Clerk
 * webhook for the MVP. Returns the local user row.
 *
 * Throws if there is no authenticated Clerk session — callers should be in
 * routes already protected by `proxy.ts`.
 */
export async function ensureCurrentUser() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("ensureCurrentUser called without an authenticated session");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@no-email.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    null;
  const phone = clerkUser?.primaryPhoneNumber?.phoneNumber ?? null;

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId,
      email,
      name,
      phone,
      role: "customer",
    })
    .returning();

  // Best-effort referral attribution: if the visitor arrived via /r/{code}
  // we dropped a cookie. Attach the new user to that referrer's open
  // referral, if one exists.
  await tryAttributeReferral(created.id);

  return created;
}

async function tryAttributeReferral(newLocalUserId: string) {
  const cookieStore = await cookies();
  const code = cookieStore.get(REFERRAL_COOKIE)?.value;
  if (!code) return;

  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralCode, code),
  });
  if (!referrer) return;

  // Best-effort: write a Contact for this user if we know their email,
  // then create the referral row. Contact creation needs a business; we
  // pull it from the campaign.
  const campaign = await db.query.referralCampaigns.findFirst({
    where: (c, { eq: e }) => e(c.id, referrer.campaignId),
  });
  if (!campaign?.businessId) return;

  const newUser = await db.query.users.findFirst({
    where: eq(users.id, newLocalUserId),
  });
  if (!newUser) return;

  // Upsert a contact for this referred user.
  const [contact] = await db
    .insert(contacts)
    .values({
      businessId: campaign.businessId,
      linkedUserId: newUser.id,
      name: newUser.name ?? newUser.email,
      email: newUser.email,
      phone: newUser.phone,
      source: "referral",
    })
    .onConflictDoNothing()
    .returning();

  if (!contact) return; // race or duplicate; skip

  await db.insert(referrals).values({
    referrerId: referrer.id,
    campaignId: referrer.campaignId,
    referredContactId: contact.id,
    referredUserId: newUser.id,
    status: "signed_up",
    signedUpAt: new Date(),
  });

  // We'd clear the cookie here; deferred to a server action because
  // `cookies()` in a server component can't write.
}

export const REFERRAL_COOKIE_NAME = REFERRAL_COOKIE;
