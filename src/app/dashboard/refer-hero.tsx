"use client";

import { useActionState, useState } from "react";

import { NavyCard, kitButton } from "@/components/brand/brand-frame";
import { cn } from "@/lib/utils";

import { submitReferralAction, type SubmitReferralResult } from "./actions";

type Props = {
  link: string;
  rewardYou: string; // "$200"
  friendOffer: string | null; // e.g. "$50 off" — from campaign.settings.friendOffer
  brandName: string;
};

function fieldError(state: SubmitReferralResult | null, field: string) {
  if (!state || state.ok) return undefined;
  if ("fieldErrors" in state) return state.fieldErrors[field]?.[0];
  return undefined;
}

/**
 * Port of templates/referral/Referral.dc.html ("Refer a friend" screen) from
 * the PCE Website design project, wired to the live referral system.
 */
export function ReferHero({ link, rewardYou, friendOffer, brandName }: Props) {
  const [state, action, pending] = useActionState<SubmitReferralResult | null, FormData>(
    submitReferralAction,
    null,
  );
  const [copied, setCopied] = useState(false);

  const msg = friendOffer
    ? `${brandName} did a great job for us — use my link and get ${friendOffer} your first service call: ${link}`
    : `${brandName} did a great job for us — use my link when you book: ${link}`;
  const sms = `sms:?&body=${encodeURIComponent(msg)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const heroLine = friendOffer
    ? `${friendOffer} for them. ${rewardYou} for you.`
    : `${rewardYou} for every friend you send.`;
  const heroSub = friendOffer
    ? `Give a friend ${friendOffer} their first ${brandName} service call. Once their job is complete, you pick a ${rewardYou} gift card.`
    : `Send a friend to ${brandName}. Once their job is complete, you pick a ${rewardYou} gift card.`;

  const generalError = state && !state.ok && "error" in state ? state.error : undefined;

  return (
    <NavyCard className="px-8 py-9">
      <span className="mb-2.5 inline-block font-display text-[13px] tracking-[1.5px] text-pce-teal">
        Refer a Friend
      </span>
      <h1 className="mb-3 font-display text-[38px] text-pce-cream">{heroLine}</h1>
      <p className="mb-6 text-[17px] leading-[1.6] text-white">{heroSub}</p>

      {state?.ok ? (
        <div className="mb-5 rounded-[14px] border border-white/20 bg-white/10 px-5 py-4 text-white">
          <p className="font-display text-lg text-pce-cream">Referral Sent!</p>
          <p className="mt-1 text-[15px] leading-[1.5]">
            We&rsquo;ll reach out to your friend. As soon as their job is complete, we&rsquo;ll text
            you a link to pick your {rewardYou} gift card.
          </p>
        </div>
      ) : (
        <form action={action} className="mb-4">
          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <input name="name" required placeholder="Friend's name" className={kitButton.inputOnNavy} />
              {fieldError(state, "name") && (
                <p className="mt-1 text-xs text-pce-cream">{fieldError(state, "name")}</p>
              )}
            </div>
            <div>
              <input name="phone" type="tel" placeholder="Friend's phone" className={kitButton.inputOnNavy} />
              {fieldError(state, "phone") && (
                <p className="mt-1 text-xs text-pce-cream">{fieldError(state, "phone")}</p>
              )}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <input name="email" type="email" placeholder="Friend's email (optional)" className={kitButton.inputOnNavy} />
              {fieldError(state, "email") && (
                <p className="mt-1 text-xs text-pce-cream">{fieldError(state, "email")}</p>
              )}
            </div>
            <input name="note" placeholder="Anything we should know?" className={kitButton.inputOnNavy} />
          </div>
          {generalError && <p className="mb-3 text-sm text-pce-cream">{generalError}</p>}
          <button type="submit" disabled={pending} className={cn(kitButton.primary, "w-full text-lg")}>
            {pending ? "Sending…" : "Send Referral"}
          </button>
        </form>
      )}

      <p className="mb-3 mt-5 text-center text-[13px] uppercase tracking-[1px] text-pce-sky-deep">
        Or share your link
      </p>
      <div className="mb-3 flex flex-wrap justify-center gap-2.5">
        <a href={sms} className={kitButton.ghostOnNavy}>
          Text a Friend
        </a>
        <a href={fb} target="_blank" rel="noopener" className={kitButton.ghostOnNavy}>
          Facebook
        </a>
        <a href={x} target="_blank" rel="noopener" className={kitButton.ghostOnNavy}>
          X
        </a>
      </div>
      <button type="button" onClick={copy} className={cn(kitButton.secondary, "w-full")}>
        {copied ? "Copied!" : "Copy Referral Link"}
      </button>
      <code className="mt-2 block truncate text-center font-mono text-[11px] text-pce-sky-deep">
        {link}
      </code>

      <div className="mt-5 rounded-[14px] border border-white/20 bg-white/10 px-5 pb-4 pt-5">
        <p className="mb-3 font-display text-[15px] tracking-[0.5px] text-pce-cream">How It Works</p>
        <div className="flex flex-col gap-2.5 text-[15px] leading-[1.5] text-white">
          <p>
            <strong className="text-pce-teal">1.</strong> Refer a friend or share your link.
          </p>
          <p>
            <strong className="text-pce-teal">2.</strong>{" "}
            {friendOffer
              ? `They get ${friendOffer} their first service call.`
              : "They book their first service call with us."}
          </p>
          <p>
            <strong className="text-pce-teal">3.</strong> When their job is complete, you pick a{" "}
            {rewardYou} gift card.
          </p>
        </div>
      </div>
    </NavyCard>
  );
}
