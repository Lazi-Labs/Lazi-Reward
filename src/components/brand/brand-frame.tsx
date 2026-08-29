import Image from "next/image";

import type { BusinessBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Full-height sky→sand wash with the business logo on top and the phone
 * footer below — the shell every customer-facing brand page sits in.
 */
export function BrandFrame({
  brand,
  children,
  className,
}: {
  brand: BusinessBrand;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="pce-wash flex min-h-screen flex-col items-center px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-6 sm:px-5 sm:pt-10">
      <Image
        src={brand.logo}
        alt={brand.logoAlt}
        width={220}
        height={124}
        priority
        className="mb-5 h-auto w-[170px] sm:mb-7 sm:w-[220px]"
      />
      <div className={cn("w-full", className)}>{children}</div>
      <p className="mt-6 text-balance text-center text-[13.5px] text-pce-muted">
        {brand.longName} ·{" "}
        <a
          href={brand.phoneHref}
          className="whitespace-nowrap font-bold text-pce-coral hover:text-pce-red-deep"
        >
          {brand.phone}
        </a>
      </p>
    </div>
  );
}

/** White card with the teal bottom edge from the design. */
export function BrandCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-pce-line border-b-[5px] border-b-pce-teal bg-white px-5 py-8 shadow-[0_20px_50px_rgba(0,40,70,0.14)] sm:px-9 sm:py-11",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Navy gradient card with the teal bottom edge from the design. */
export function NavyCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pce-navy-card w-full rounded-2xl border-b-[5px] border-b-pce-teal px-5 py-8 shadow-[0_20px_50px_rgba(0,40,70,0.28)] sm:px-9 sm:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const kitButton = {
  primary:
    "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-pce-red-deep border-b-4 bg-pce-coral px-6 pb-[13px] pt-4 text-center font-display text-[17px] leading-none tracking-[0.5px] text-white transition-colors hover:border-pce-coral hover:bg-pce-red-deep focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pce-teal/50 disabled:opacity-60 sm:px-8 sm:pb-[15px] sm:pt-[18px] sm:text-[19px]",
  secondary:
    "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-pce-navy border-b-4 bg-white px-6 pb-[11px] pt-[14px] text-center font-display text-[15px] leading-none tracking-[0.5px] text-pce-navy transition-colors hover:bg-pce-sky focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pce-teal/50 disabled:opacity-60",
  ghostOnNavy:
    "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-white border-b-4 bg-transparent px-5 pb-[9px] pt-3 font-display text-sm leading-none text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pce-teal/50",
  input:
    "min-h-12 w-full rounded-xl border border-pce-teal border-b-4 bg-white px-4 pb-3 pt-3.5 text-base text-pce-ink outline-none placeholder:text-pce-muted focus:border-pce-navy focus:ring-[3px] focus:ring-pce-teal/45",
  inputOnNavy:
    "min-h-12 w-full rounded-xl border border-pce-navy bg-white px-4 pb-3 pt-3.5 text-base text-pce-ink outline-none placeholder:text-pce-muted focus:border-pce-teal focus:ring-[3px] focus:ring-pce-teal/55",
};
