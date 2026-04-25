import { eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { referralClicks, referrers } from "@/db/schema";
import { REFERRAL_COOKIE_NAME } from "@/lib/users";

const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const referrer = await db.query.referrers.findFirst({
    where: eq(referrers.referralCode, code),
  });

  if (!referrer) {
    // Unknown code — silently send to public marketing.
    redirect("/");
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const referer = headerStore.get("referer") ?? null;

  // Record the click + bump the counter. Best-effort; don't block the
  // redirect on a DB hiccup.
  try {
    await Promise.all([
      db.insert(referralClicks).values({
        referrerId: referrer.id,
        ipAddress: ip,
        userAgent,
        refererUrl: referer,
      }),
      db
        .update(referrers)
        .set({ totalReach: sql`${referrers.totalReach} + 1` })
        .where(eq(referrers.id, referrer.id)),
    ]);
  } catch (err) {
    console.error("Failed to record referral click", err);
  }

  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, referrer.referralCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_TTL_SECONDS,
    path: "/",
  });

  redirect("/sign-up");
}
