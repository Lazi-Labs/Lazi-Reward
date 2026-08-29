"use client";

import { useState, useTransition } from "react";

import { BrandCard, NavyCard, kitButton } from "@/components/brand/brand-frame";
import { FEEDBACK_QUESTIONS, REVIEW_GATE } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { claimGiftAction, feedbackAction, rateAction } from "./actions";

type Step = "rate" | "share" | "feedback" | "thanks-call" | "thanks-fb";

type Props = {
  businessSlug: string;
  businessName: string;
  token: string | null;
  googleUrl: string | null;
  contactFirstName: string | null;
  /** Unconditional thank-you gift for this customer, if one was offered. */
  gift: {
    amount: number;
    /** Already ordered → redemption link; otherwise null and the customer picks. */
    link: string | null;
    productName: string | null;
    products: { id: string; name: string; imageUrl: string | null }[];
  } | null;
};

const ACTIVE = "#F5A623";

function Star({
  on,
  size,
  ...rest
}: { on: boolean; size: number } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="cursor-pointer border-0 bg-transparent px-1.5 py-1 leading-none transition-colors"
      style={{ fontSize: size, color: on ? ACTIVE : "#D9E6F0" }}
    >
      ★
    </button>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Rate screen only: tease the gift; the picker unlocks after any rating
 * (1–5). Never conditioned on sentiment or on a Google review.
 */
function GiftTeaser({ amount }: { amount: number }) {
  return (
    <div className="mx-auto mb-5 w-full max-w-[560px] rounded-[14px] border-2 border-dashed border-pce-red-deep bg-pce-cream px-5 py-4 text-center">
      <p className="font-display text-[24px] leading-[1.1] text-pce-red-deep">
        Get Rewarded — On Us, Instantly
      </p>
      <p className="mt-1 text-[14.5px] leading-[1.5] text-pce-brown">
        Rate your visit below and pick a {money.format(amount)} gift card — Venmo, Amazon, Visa
        and more. Every rating counts.
      </p>
    </div>
  );
}

/**
 * Shown after the customer has rated (any stars). The gift is a thank-you
 * for the job — copy must never tie it to the rating given or to reviewing
 * (design/README.md). The customer picks a card here; that click creates the
 * Tremendous order.
 */
function GiftBanner({
  gift,
  businessSlug,
  token,
}: {
  gift: NonNullable<Props["gift"]>;
  businessSlug: string;
  token: string | null;
}) {
  const [link, setLink] = useState<string | null>(gift.link);
  const [productName, setProductName] = useState<string | null>(gift.productName);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function choose(p: { id: string; name: string }) {
    if (!token || pending) return;
    setChoosing(p.id);
    setErr(null);
    start(async () => {
      const res = await claimGiftAction({ businessSlug, token, productId: p.id });
      if (res.ok) {
        setLink(res.link);
        setProductName(res.productName);
        window.location.assign(res.link);
      } else {
        setErr(res.error);
        setChoosing(null);
      }
    });
  }

  return (
    <div className="mx-auto mb-5 w-full max-w-[560px] rounded-[14px] border-2 border-dashed border-pce-red-deep bg-pce-cream px-5 py-4 text-center">
      <p className="font-display text-[22px] leading-[1.1] text-pce-red-deep">
        A {money.format(gift.amount)} Thank-You, On Us
      </p>
      {link ? (
        <>
          <p className="mb-3 mt-1 text-[14.5px] leading-[1.5] text-pce-brown">
            Your {productName ?? "gift"} is ready — it&rsquo;s yours either way.
          </p>
          <a href={link} target="_blank" rel="noopener" className={cn(kitButton.primary, "text-base")}>
            Open Your Gift →
          </a>
        </>
      ) : (
        <>
          <p className="mb-3 mt-1 text-[14.5px] leading-[1.5] text-pce-brown">
            Thanks for rating us! Tap the gift card you&rsquo;d like — it&rsquo;s yours.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gift.products.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={pending}
                onClick={() => choose(p)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border border-pce-line border-b-[3px] bg-white px-2 py-3 text-[13px] font-bold text-pce-ink transition-colors hover:border-pce-coral hover:bg-pce-sky/40 disabled:opacity-60",
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
          {err ? <p className="mt-3 text-[13px] text-pce-red-deep">{err}</p> : null}
        </>
      )}
    </div>
  );
}

export function ReviewFunnel({
  businessSlug,
  businessName,
  token,
  googleUrl,
  contactFirstName,
  gift,
}: Props) {
  const [step, setStep] = useState<Step>("rate");
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(0);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ctx = { businessSlug, token };

  function pick(n: number) {
    setPicked(n);
    const sentToGoogle = n >= REVIEW_GATE;
    start(async () => {
      try {
        const res = await rateAction({ ...ctx, rating: n, sentToGoogle });
        setReviewId(res.reviewId);
      } catch (err) {
        console.error(err);
      }
      setHover(0);
      setStep(sentToGoogle ? "share" : "feedback");
    });
  }

  function submitFeedback(wantsCall: boolean) {
    if (!reviewId) return;
    setError(null);
    start(async () => {
      try {
        await feedbackAction({
          ...ctx,
          reviewId,
          rating: picked,
          scores: scores as Record<(typeof FEEDBACK_QUESTIONS)[number], number>,
          message,
          name,
          phone,
          wantsCall,
        });
        setStep(wantsCall ? "thanks-call" : "thanks-fb");
      } catch (err) {
        console.error(err);
        setError("Something went wrong sending your feedback. Please call us instead.");
      }
    });
  }

  const greeting = contactFirstName ? `Thanks, ${contactFirstName}!` : "Thanks for choosing us!";
  const banner = gift ? <GiftBanner gift={gift} businessSlug={businessSlug} token={token} /> : null;

  if (step === "rate") {
    return (
      <>
        {gift ? <GiftTeaser amount={gift.amount} /> : null}
        <BrandCard className="mx-auto max-w-[560px] text-center">
          <h1 className="mb-2.5 font-display text-[40px] text-pce-navy">How Did We Do?</h1>
          <p className="mb-7 text-lg leading-[1.55] text-pce-body">
            {greeting} Tap a star to rate your recent {businessName} service visit.
          </p>
          <div onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={52}
                on={(hover || picked) >= n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => pick(n)}
                disabled={pending}
              />
            ))}
          </div>
          <p className="mt-5 text-[15px] text-pce-muted">
            {hover ? `${hover} of 5 stars` : "Your feedback helps our whole crew."}
          </p>
        </BrandCard>
      </>
    );
  }

  if (step === "share") {
    return (
      <>
        {banner}
        <NavyCard className="mx-auto max-w-[560px] text-center">
          <div className="mb-3.5 text-[44px] leading-none text-pce-cream">
            {"★".repeat(picked)}
          </div>
          <h1 className="mb-3 font-display text-4xl text-pce-cream">You Just Made Our Day!</h1>
          <p className="mb-6 text-lg leading-[1.6] text-white">
            Reviews are how neighbors find a crew they can trust. If you have a minute, would you
            share your experience on Google?
          </p>
          {googleUrl ? (
            <a href={googleUrl} target="_blank" rel="noopener" className={kitButton.primary}>
              Share on Google →
            </a>
          ) : null}
          <p className="mt-4 text-[13.5px] leading-[1.6] text-pce-sky-deep">
            Takes about 60 seconds. Honest feedback — good or bad — is what helps us most.
          </p>
        </NavyCard>
      </>
    );
  }

  if (step === "feedback") {
    return (
      <>
        {banner}
        <BrandCard className="mx-auto max-w-[620px]">
          <h1 className="mb-2.5 text-center font-display text-[32px] text-pce-navy">
            Help Us Make It Right
          </h1>
          <p className="mb-7 text-center text-[17px] leading-[1.55] text-pce-body">
            We&rsquo;re sorry we missed the mark. Rate each part of your experience so we know
            exactly where to improve.
          </p>
          {FEEDBACK_QUESTIONS.map((q) => (
            <div
              key={q}
              className="flex items-center justify-between gap-4 border-b border-pce-sky py-3.5"
            >
              <span className="text-[16.5px] font-medium text-pce-ink">{q}</span>
              <span className="flex flex-none gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={26}
                    on={(scores[q] ?? 0) >= n}
                    aria-label={`${q}: ${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => setScores((s) => ({ ...s, [q]: n }))}
                  />
                ))}
              </span>
            </div>
          ))}
          <label htmlFor="fb-msg" className="mb-2.5 mt-6 block font-display text-base text-pce-navy">
            Tell us what happened
          </label>
          <textarea
            id="fb-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share any details about your experience..."
            className={cn(kitButton.input, "min-h-[120px] resize-y")}
          />
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={kitButton.input}
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className={kitButton.input}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-pce-red-deep">{error}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => submitFeedback(true)}
            className={cn(kitButton.primary, "mt-5 w-full text-lg leading-[1.25]")}
          >
            Request a Manager or Supervisor to Call You
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submitFeedback(false)}
            className={cn(kitButton.secondary, "mt-3 w-full")}
          >
            Just Send My Feedback
          </button>
        </BrandCard>
      </>
    );
  }

  const call = step === "thanks-call";
  return (
    <>
      {banner}
      <BrandCard className="mx-auto max-w-[560px] py-13 text-center">
        <div className="mb-3.5 text-[46px] leading-none text-pce-teal">✓</div>
        <h1 className="mb-2.5 font-display text-[32px] text-pce-navy">
          {call ? "A Manager Will Call You" : "Feedback Received"}
        </h1>
        <p className="text-[17px] leading-[1.6] text-pce-body">
          {call
            ? "Thank you for the details. A manager or supervisor will reach out within one business day to make things right."
            : "Thank you for the details. Our team reviews every response and will use yours to improve."}
        </p>
      </BrandCard>
    </>
  );
}
