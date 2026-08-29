"use client";

import { useState, useTransition } from "react";

import { BrandCard, kitButton } from "@/components/brand/brand-frame";
import type { ClaimableReward } from "@/lib/referrals";
import { cn } from "@/lib/utils";

import { claimRewardAction } from "./actions";

type Product = { id: string; name: string; imageUrl: string | null };

type Props = {
  rewards: ClaimableReward[];
  products: Product[];
  rewardAmountFmt: (n: number) => string;
};

/**
 * Referral reward claim — same gift-card tiles as the review funnel. Picking a
 * card places the Tremendous order for that product.
 */
export function RewardClaim({ rewards, products, rewardAmountFmt }: Props) {
  const [idx, setIdx] = useState(0);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [done, setDone] = useState<{ link: string; product: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reward = rewards[idx];
  if (!reward) return null;
  const amount = rewardAmountFmt(Number(reward.amount));

  if (done) {
    return (
      <BrandCard className="text-center">
        <div className="mb-3.5 text-[46px] leading-none text-pce-teal">✓</div>
        <h2 className="mb-2.5 font-display text-[30px] text-pce-navy sm:text-[32px]">Your {done.product} Is Ready!</h2>
        <p className="mb-5 text-[17px] leading-[1.6] text-pce-body">
          Thank you for spreading the word. It opened in a new tab — the button works any time.
        </p>
        <a href={done.link} target="_blank" rel="noopener" className={kitButton.primary}>
          Open Your Gift →
        </a>
        {idx + 1 < rewards.length ? (
          <button
            type="button"
            className={cn(kitButton.secondary, "mt-4 w-full")}
            onClick={() => {
              setDone(null);
              setIdx(idx + 1);
            }}
          >
            Claim your next reward
          </button>
        ) : null}
      </BrandCard>
    );
  }

  function choose(p: Product) {
    if (pending) return;
    setChoosing(p.id);
    setError(null);
    start(async () => {
      const res = await claimRewardAction({ rewardId: reward.id, productId: p.id });
      if (!res.ok) {
        setError(res.error);
        setChoosing(null);
        return;
      }
      setDone({ link: res.link, product: res.productName });
      window.open(res.link, "_blank", "noopener");
    });
  }

  return (
    <BrandCard className="px-5 py-7 sm:px-8 sm:py-9">
      <div className="pce-navy-card mb-6 rounded-[14px] px-6 pb-5 pt-6">
        <p className="mb-1.5 font-display text-[13px] tracking-[1.5px] text-pce-teal">Your Reward</p>
        <p className="mb-1.5 font-display text-[44px] leading-none text-pce-cream">{amount}</p>
        <p className="text-[14.5px] text-pce-sky-deep">
          Referral bonus · {reward.referredName}&rsquo;s job is complete
        </p>
      </div>
      <p className="mb-3 text-[15px] text-pce-body">Tap the gift card you&rsquo;d like:</p>
      {products.length === 0 ? (
        <p className="text-sm text-pce-red-deep">
          Gift cards aren&rsquo;t set up yet — call us and we&rsquo;ll take care of it.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => choose(p)}
              className={cn(
                "flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-pce-line border-b-[3px] bg-white px-2 py-3 text-[13px] font-bold text-pce-ink transition-colors hover:border-pce-coral hover:bg-pce-sky/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pce-teal/50 disabled:opacity-60",
                choosing === p.id && "border-pce-coral",
              )}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="h-8 w-auto max-w-[96px] object-contain" />
              ) : (
                <span className="h-8" />
              )}
              <span>{choosing === p.id ? "Issuing…" : p.name}</span>
            </button>
          ))}
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-pce-red-deep">{error}</p> : null}
    </BrandCard>
  );
}
