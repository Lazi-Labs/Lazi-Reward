"use client";

import { useState, useTransition } from "react";

import { BrandCard, kitButton } from "@/components/brand/brand-frame";
import { PayoutPicker } from "@/components/brand/payout-picker";
import { payoutById } from "@/lib/brand";
import type { ClaimableReward } from "@/lib/referrals";
import { cn } from "@/lib/utils";

import { claimRewardAction } from "./actions";

type Props = {
  rewards: ClaimableReward[];
  rewardAmountFmt: (n: number) => string;
};

/**
 * Port of the "Claim your reward" + "Reward claimed" screens from
 * templates/referral/Referral.dc.html. Shown only while a reward is pending.
 */
export function RewardClaim({ rewards, rewardAmountFmt }: Props) {
  const [idx, setIdx] = useState(0);
  const [payout, setPayout] = useState("mastercard");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reward = rewards[idx];
  if (!reward) return null;
  const amount = rewardAmountFmt(Number(reward.amount));
  const chosen = payoutById(payout);
  const needsDetails = ["venmo", "cashapp", "bank", "charity"].includes(payout);

  if (done) {
    return (
      <BrandCard className="text-center">
        <div className="mb-3.5 text-[46px] leading-none text-pce-teal">✓</div>
        <h2 className="mb-2.5 font-display text-[32px] text-pce-navy">Your Reward Is on the Way!</h2>
        <p className="text-[17px] leading-[1.6] text-pce-body">{done}</p>
        {idx + 1 < rewards.length ? (
          <button
            type="button"
            className={cn(kitButton.secondary, "mt-5")}
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

  function claim() {
    setError(null);
    start(async () => {
      const res = await claimRewardAction({
        rewardId: reward.id,
        paymentMethod: payout,
        paymentDetails: details || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(
        chosen.id === "charity"
          ? `Your ${amount} will be donated to the charity of your choice — we'll text you to confirm the cause. Thank you for spreading the word!`
          : `Your ${amount} via ${chosen.name} will be sent within one business day. Thank you for spreading the word!`,
      );
    });
  }

  return (
    <BrandCard className="px-8 py-9">
      <div className="pce-navy-card mb-6 rounded-[14px] px-6 pb-5 pt-6">
        <p className="mb-1.5 font-display text-[13px] tracking-[1.5px] text-pce-teal">Your Reward</p>
        <p className="mb-1.5 font-display text-[44px] leading-none text-pce-cream">{amount}</p>
        <p className="text-[14.5px] text-pce-sky-deep">
          Referral bonus · {reward.referredName}&rsquo;s job is complete
        </p>
      </div>
      <PayoutPicker value={payout} onChange={setPayout} />
      {needsDetails ? (
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            payout === "venmo"
              ? "Your Venmo @username"
              : payout === "cashapp"
                ? "Your $cashtag"
                : payout === "bank"
                  ? "Best phone/email to send a secure deposit form"
                  : "Charity name"
          }
          className={cn(kitButton.input, "mt-2")}
        />
      ) : null}
      {error ? <p className="mt-3 text-sm text-pce-red-deep">{error}</p> : null}
      <button
        type="button"
        onClick={claim}
        disabled={pending}
        className={cn(kitButton.primary, "mt-4 w-full text-lg")}
      >
        {pending ? "Sending…" : "Send My Reward"}
      </button>
    </BrandCard>
  );
}
