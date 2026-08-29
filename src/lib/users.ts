import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { users } from "@/db/schema";

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
  if (existing) {
    await tryAttributeReferral(existing.id);
    return existing;
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@no-email.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;
  const phone = clerkUser?.primaryPhoneNumber?.phoneNumber ?? null;

  // Race-safe: two first requests can both miss the SELECT above.
  const [created] = await db
    .insert(users)
    .values({ clerkUserId, email, name, phone, role: "customer" })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email, name: sql`COALESCE(${users.name}, ${name})`, phone: sql`COALESCE(${users.phone}, ${phone})`, updatedAt: new Date() },
    })
    .returning();

  await tryAttributeReferral(created.id);
  return created;
}

/**
 * If the visitor arrived via /r/<code> we dropped a cookie. Attribute this
 * user to that referrer (new OR existing user), then forget the cookie.
 * Cookie writes are only legal in actions/route handlers, so the clear
 * happens by expiring it via the /api/ref/clear beacon the dashboard fires.
 */
async function tryAttributeReferral(localUserId: string) {
  const cookieStore = await cookies();
  const code = cookieStore.get(REFERRAL_COOKIE)?.value;
  if (!code) return;
  const user = await db.query.users.findFirst({ where: eq(users.id, localUserId) });
  if (!user) return;
  try {
    const { attributeReferral } = await import("@/lib/referrals");
    await attributeReferral({
      code,
      contact: {
        name: user.name ?? user.phone ?? "New customer",
        email: user.email.endsWith("@no-email.local") ? null : user.email,
        phone: user.phone,
        linkedUserId: user.id,
      },
      source: "cookie",
      status: "signed_up",
    });
  } catch (err) {
    console.error("referral attribution failed", err);
  }
}

export const REFERRAL_COOKIE_NAME = REFERRAL_COOKIE;
