"use client";

import { useState, useTransition } from "react";

import { BrandCard, kitButton } from "@/components/brand/brand-frame";
import type { BusinessBrand } from "@/lib/brand";
import type { ServiceOption } from "@/lib/servicetitan";
import { cn } from "@/lib/utils";

import { submitBookingAction, type BookingInput, type BookingResult } from "./actions";

type Props = {
  brand: BusinessBrand;
  services: ServiceOption[];
  referral: { code: string; referrerFirst: string; friendOffer: string | null } | null;
};

const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return {
    value: d.toISOString().slice(0, 10),
    label: i === 0 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  };
});

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-bold uppercase tracking-[1px] text-pce-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-pce-red-deep">{error}</span> : null}
    </label>
  );
}

export function BookingWizard({ brand, services, referral }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<BookingInput>({
    service: "",
    name: "",
    phone: "",
    email: "",
    street: "",
    unit: "",
    city: "",
    state: "FL",
    zip: "",
    preferredDay: "",
    preferredWindow: "",
    notes: "",
    gateCode: "",
    dog: false,
    ref: referral?.code ?? "",
  });
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, start] = useTransition();
  const fe = (k: string) => (result && !result.ok ? result.fieldErrors?.[k]?.[0] : undefined);
  const set = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const svc = services.find((s) => s.id === form.service);

  function submit() {
    start(async () => {
      const res = await submitBookingAction(form);
      setResult(res);
      if (res.ok) setStep(4);
    });
  }

  const stepper = (
    <ol className="mb-5 flex justify-center gap-2" aria-label="Progress">
      {[1, 2, 3].map((n) => (
        <li key={n} className={cn("h-1.5 w-10 rounded-full", n <= step ? "bg-pce-coral" : "bg-pce-line")} aria-current={n === step ? "step" : undefined} />
      ))}
    </ol>
  );

  if (step === 4 && result?.ok) {
    return (
      <BrandCard className="mx-auto max-w-[560px] text-center">
        <div className="mb-3.5 text-[46px] leading-none text-pce-teal">✓</div>
        <h1 className="mb-2.5 font-display text-[30px] text-pce-navy sm:text-[34px]">You&rsquo;re Booked In</h1>
        <p className="text-[17px] leading-[1.6] text-pce-body">
          {svc?.emergency
            ? "Our office is calling you now. If you don't hear from us in 10 minutes, call "
            : "Our office will call you within the hour to lock in a time. Questions? Call "}
          <a href={brand.phoneHref} className="whitespace-nowrap font-bold text-pce-coral">{brand.phone}</a>.
        </p>
        {result.referred ? (
          <p className="mt-4 rounded-[14px] bg-pce-cream px-4 py-3 text-[15px] text-pce-brown">
            Your referral from <strong>{referral?.referrerFirst}</strong> is on file
            {referral?.friendOffer ? ` — ${referral.friendOffer} your first visit.` : "."}
          </p>
        ) : null}
      </BrandCard>
    );
  }

  return (
    <BrandCard className="mx-auto max-w-[620px]">
      {referral ? (
        <div className="mb-5 rounded-[14px] border-2 border-dashed border-pce-red-deep bg-pce-cream px-4 py-3 text-center">
          <p className="font-display text-[20px] leading-[1.1] text-pce-red-deep">
            Referred by {referral.referrerFirst}
          </p>
          {referral.friendOffer ? (
            <p className="mt-1 text-[14.5px] text-pce-brown">{referral.friendOffer} your first service call — applied automatically.</p>
          ) : null}
        </div>
      ) : null}
      {stepper}

      {step === 1 ? (
        <>
          <h1 className="mb-1 text-center font-display text-[30px] text-pce-navy sm:text-[36px]">What Do You Need?</h1>
          <p className="mb-5 text-center text-[16px] text-pce-body">Pick the closest match — we&rsquo;ll sort out the details on the call.</p>
          <div className="grid gap-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  set("service", s.id);
                  if (s.emergency) set("preferredWindow", "asap");
                  setStep(2);
                }}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-pce-line border-b-[3px] bg-white px-4 py-3 text-left transition-colors hover:border-pce-coral hover:bg-pce-sky/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pce-teal/50",
                  form.service === s.id && "border-pce-coral",
                  s.emergency && "border-pce-red-deep/40 bg-pce-cream/40",
                )}
              >
                <span>
                  <span className="block text-[16px] font-bold text-pce-ink">{s.label}</span>
                  <span className="block text-[13px] text-pce-muted">{s.hint}</span>
                </span>
                <span className="text-pce-coral" aria-hidden>→</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1 className="mb-1 text-center font-display text-[30px] text-pce-navy sm:text-[36px]">Where &amp; Who</h1>
          <p className="mb-5 text-center text-[16px] text-pce-body">{svc?.label}</p>
          <div className="grid gap-3.5">
            <Field label="Your name" error={fe("name")}>
              <input className={kitButton.input} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Mobile phone" error={fe("phone")}>
                <input className={kitButton.input} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="Email (optional)" error={fe("email")}>
                <input className={kitButton.input} type="email" inputMode="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </Field>
            </div>
            <Field label="Service address" error={fe("street")}>
              <input className={kitButton.input} value={form.street} onChange={(e) => set("street", e.target.value)} autoComplete="street-address" placeholder="Street" />
            </Field>
            <div className="grid grid-cols-[1fr_1fr_5rem] gap-3.5">
              <Field label="City" error={fe("city")}>
                <input className={kitButton.input} value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
              </Field>
              <Field label="ZIP" error={fe("zip")}>
                <input className={kitButton.input} inputMode="numeric" value={form.zip} onChange={(e) => set("zip", e.target.value)} autoComplete="postal-code" />
              </Field>
              <Field label="Unit">
                <input className={kitButton.input} value={form.unit ?? ""} onChange={(e) => set("unit", e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" className={cn(kitButton.secondary, "flex-none")} onClick={() => setStep(1)}>Back</button>
            <button
              type="button"
              className={cn(kitButton.primary, "flex-1")}
              onClick={() => {
                if (form.name.trim().length < 2 || form.phone.replace(/\D/g, "").length < 10 || !form.street || !form.city || !form.zip) {
                  setResult({ ok: false, error: "Fill in name, phone and address.", fieldErrors: {
                    ...(form.name.trim().length < 2 ? { name: ["Enter your name"] } : {}),
                    ...(form.phone.replace(/\D/g, "").length < 10 ? { phone: ["Enter a 10-digit phone"] } : {}),
                    ...(!form.street ? { street: ["Enter the street"] } : {}),
                    ...(!form.city ? { city: ["City"] } : {}),
                    ...(!form.zip ? { zip: ["ZIP"] } : {}),
                  } });
                  return;
                }
                setResult(null);
                setStep(3);
              }}
            >
              Next →
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h1 className="mb-1 text-center font-display text-[30px] text-pce-navy sm:text-[36px]">When Works?</h1>
          <p className="mb-5 text-center text-[16px] text-pce-body">We&rsquo;ll call to confirm the exact arrival window.</p>
          {svc?.emergency ? (
            <p className="mb-4 rounded-xl bg-pce-cream px-4 py-3 text-[15px] text-pce-brown">Emergency — we&rsquo;ll call you right away. Skip ahead and send it.</p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DAYS.map((d) => (
                  <button key={d.value} type="button" onClick={() => set("preferredDay", d.label)} className={cn("min-h-11 cursor-pointer rounded-xl border border-pce-line bg-white px-2 text-[14px] font-medium text-pce-ink transition-colors hover:border-pce-coral", form.preferredDay === d.label && "border-pce-coral bg-pce-sky/50")}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {([["morning", "Morning (8–12)"], ["afternoon", "Afternoon (12–5)"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set("preferredWindow", v)} className={cn("min-h-11 cursor-pointer rounded-xl border border-pce-line bg-white px-2 text-[14px] font-medium text-pce-ink transition-colors hover:border-pce-coral", form.preferredWindow === v && "border-pce-coral bg-pce-sky/50")}>
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="grid gap-3.5">
            <Field label="Anything we should know? (optional)">
              <textarea className={cn(kitButton.input, "min-h-[88px] resize-y")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="What's going on, equipment brand, best time to call…" />
            </Field>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3.5">
              <Field label="Gate code (optional)">
                <input className={kitButton.input} value={form.gateCode ?? ""} onChange={(e) => set("gateCode", e.target.value)} />
              </Field>
              <label className="flex min-h-12 cursor-pointer items-center gap-2 text-[15px] text-pce-ink">
                <input type="checkbox" className="size-5 accent-pce-coral" checked={Boolean(form.dog)} onChange={(e) => set("dog", e.target.checked)} /> Dog on property
              </label>
            </div>
          </div>
          {result && !result.ok ? <p className="mt-3 text-sm text-pce-red-deep">{result.error}</p> : null}
          <div className="mt-5 flex gap-2">
            <button type="button" className={cn(kitButton.secondary, "flex-none")} onClick={() => setStep(2)}>Back</button>
            <button type="button" disabled={pending} className={cn(kitButton.primary, "flex-1")} onClick={submit}>
              {pending ? "Sending…" : "Book My Service →"}
            </button>
          </div>
        </>
      ) : null}
    </BrandCard>
  );
}
