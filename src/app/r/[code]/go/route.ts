import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { referrers } from "@/db/schema";
import { REFERRAL_COOKIE_NAME } from "@/lib/users";

const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Sets the attribution cookie and continues to sign-up (cookies can't be set from a page). */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = await db.query.referrers.findFirst({ where: eq(referrers.referralCode, code) });
  const url = new URL(referrer ? "/sign-up" : "/", req.url);
  if (referrer) {
    const store = await cookies();
    store.set(REFERRAL_COOKIE_NAME, referrer.referralCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_TTL_SECONDS,
      path: "/",
    });
  }
  return NextResponse.redirect(url);
}
