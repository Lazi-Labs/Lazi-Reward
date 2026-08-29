import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BrandCard, BrandFrame, kitButton } from "@/components/brand/brand-frame";
import { db } from "@/db";
import { referralCampaigns, referralClicks, referrers, users } from "@/db/schema";
import { brandFor } from "@/lib/brand";
import { friendOfferFor } from "@/lib/referrals";

export const dynamic = "force-dynamic";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export async function generateMetadata(): Promise<Metadata> {
  return { title: "You've been referred · Perfect Catch", robots: { index: false } };
}

/**
 * Referral landing — what a friend sees when they tap a share link. Records
 * the click here; the cookie is set by /r/[code]/go (a route handler) when
 * they continue to sign-up.
 */
export default async function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const referrer = await db.query.referrers.findFirst({ where: eq(referrers.referralCode, code) });
  if (!referrer) redirect("/");

  const [campaign, refUser] = await Promise.all([
    db.query.referralCampaigns.findFirst({ where: eq(referralCampaigns.id, referrer.campaignId), with: { business: true } }),
    db.query.users.findFirst({ where: eq(users.id, referrer.userId) }),
  ]);

  const h = await headers();
  try {
    await Promise.all([
      db.insert(referralClicks).values({
        referrerId: referrer.id,
        ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
        userAgent: h.get("user-agent") ?? null,
        refererUrl: h.get("referer") ?? null,
      }),
      db.update(referrers).set({ totalReach: sql`${referrers.totalReach} + 1` }).where(eq(referrers.id, referrer.id)),
    ]);
  } catch (err) {
    console.error("Failed to record referral click", err);
  }

  const brand = brandFor(campaign?.business?.slug ?? null);
  const first = refUser?.name?.split(" ")[0] ?? "A friend";
  const friendOffer = campaign ? friendOfferFor(campaign) : null;
  const reward = campaign ? dollars.format(Number(campaign.rewardAmount)) : null;

  return (
    <BrandFrame brand={brand}>
      <BrandCard className="mx-auto max-w-[560px] text-center">
        <span className="mb-2.5 inline-block font-display text-[13px] tracking-[1.5px] text-pce-teal">
          You&rsquo;ve been referred
        </span>
        <h1 className="mb-3 font-display text-[30px] text-pce-navy sm:text-[38px]">
          {first} thinks you&rsquo;ll love {brand.name}
        </h1>
        <p className="mb-6 text-[16px] leading-[1.6] text-pce-body sm:text-[17px]">
          {friendOffer
            ? `Book with us through this link and get ${friendOffer} your first service call. ${first} gets a thank-you too.`
            : `Book your first service call through this link and we'll take great care of you — and ${first} gets a ${reward ?? "thank-you"} gift card when your job is done.`}
        </p>
        <Link href={`/book?ref=${code}`} className={`${kitButton.primary} w-full sm:w-auto`}>
          Book your service →
        </Link>
        <p className="mt-4 text-[13px] text-pce-muted">
          Takes a minute; our office calls you back to confirm. Or call{" "}
          <a href={brand.phoneHref} className="whitespace-nowrap font-bold text-pce-coral">{brand.phone}</a> and mention {first}.
          {" "}<Link href={`/r/${code}/go`} className="underline">Create an account instead</Link>
        </p>
        <ul className="mt-6 grid gap-2 text-left text-[14.5px] text-pce-body sm:grid-cols-3">
          {brand.trust.map((t) => (
            <li key={t.strong} className="rounded-xl bg-pce-sky px-3 py-2.5">
              <strong className="text-pce-navy">{t.strong}</strong> {t.rest}
            </li>
          ))}
        </ul>
      </BrandCard>
    </BrandFrame>
  );
}
