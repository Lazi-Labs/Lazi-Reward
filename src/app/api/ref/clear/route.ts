import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFERRAL_COOKIE_NAME } from "@/lib/users";

/** Expire the referral cookie once attribution has run (pages can't write cookies). */
export async function POST() {
  const store = await cookies();
  store.set(REFERRAL_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
