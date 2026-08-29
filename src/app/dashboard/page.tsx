import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { BrandCard } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";
import {
  friendOfferFor,
  getOrCreateReferrerForUser,
  getReferralStats,
  listReferralsForReferrer,
  listRewardsForReferrer,
} from "@/lib/referrals";
import { productsForGift } from "@/lib/gifts";
import { ensureCurrentUser } from "@/lib/users";
import { getBusinessById } from "@/lib/reviews";

import { RefCookieClear } from "./ref-cookie-clear";
import { ReferHero } from "./refer-hero";
import { ReferralPipeline } from "./referral-pipeline";
import { RewardClaim } from "./reward-claim";

const dollarFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <BrandCard className="px-3 py-4 sm:px-6 sm:py-6">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.2px] text-pce-muted sm:text-xs">{label}</p>
      <p className="font-display text-[34px] text-pce-navy sm:text-[40px]">{value}</p>
      <p className="mt-1 hidden text-sm text-pce-body sm:block">{note}</p>
    </BrandCard>
  );
}

export default async function DashboardPage() {
  const user = await ensureCurrentUser();
  const got = await getOrCreateReferrerForUser(user.id);
  if (!got) {
    return (
      <div className="pce-wash flex min-h-screen items-center justify-center px-5">
        <BrandCard className="max-w-[560px] text-center">
          <h1 className="mb-2 font-display text-[30px] text-pce-navy">Referral Program Paused</h1>
          <p className="text-pce-body">We&rsquo;re not accepting referrals right now. Check back soon.</p>
        </BrandCard>
      </div>
    );
  }
  const { referrer, campaign } = got;
  const [stats, rows, rewards, business] = await Promise.all([
    getReferralStats(referrer.id),
    listReferralsForReferrer(referrer.id),
    listRewardsForReferrer(referrer.id),
    campaign.businessId ? getBusinessById(campaign.businessId) : Promise.resolve(null),
  ]);
  const claimable = rewards.filter((r) => r.status === "pending" || (r.status === "failed" && !r.giftLink));
  const products =
    claimable.length && business
      ? await productsForGift({ campaignId: business.tremendousCampaignId, amount: campaign.rewardAmount })
      : [];

  const rewardAmount = dollarFmt.format(Number(campaign.rewardAmount));
  const friendOffer = friendOfferFor(campaign);
  const brand = brandFor(null);

  return (
    <div className="pce-wash min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 sm:gap-8 sm:px-5 sm:py-8">
        <header className="flex items-center justify-between">
          <Link href="/">
            <Image
              src={brand.logo}
              alt={brand.logoAlt}
              width={180}
              height={102}
              priority
              className="h-auto w-[140px] sm:w-[180px]"
            />
          </Link>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-pce-body sm:block">
              Hi, {user.name?.split(" ")[0] ?? "there"}
            </p>
            <UserButton />
          </div>
        </header>

        <RefCookieClear />
        {claimable.length > 0 ? (
          <RewardClaim rewards={claimable} products={products} rewardAmountFmt={dollarFmt.format} />
        ) : null}

        <section className="grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ReferHero
              link={referrer.referralLink}
              rewardYou={rewardAmount}
              friendOffer={friendOffer}
              brandName={brand.name}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 lg:col-span-2 lg:grid-cols-1 lg:gap-5">
            <Stat
              label="Rewards earned"
              value={dollarFmt.format(stats.totalEarningsCents / 100)}
              note={`Earn ${rewardAmount} per completed referral.`}
            />
            <Stat
              label="In progress"
              value={String(stats.pending + stats.inProgress)}
              note="People you've referred who haven't finished a job yet."
            />
            <Stat
              label="Completed"
              value={String(stats.completed)}
              note="Jobs that've closed and rewards issued."
            />
          </div>
        </section>

        <BrandCard className="px-4 py-6 sm:px-6 sm:py-7">
          <h2 className="font-display text-2xl text-pce-navy">Your Referrals</h2>
          <p className="mb-4 text-sm text-pce-body">
            Status updates as our team contacts and books each one.
          </p>
          <ReferralPipeline rows={rows} />
        </BrandCard>

        <p className="text-center text-[13.5px] text-pce-muted">
          {brand.longName} ·{" "}
          <a href={brand.phoneHref} className="font-bold text-pce-coral">
            {brand.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
