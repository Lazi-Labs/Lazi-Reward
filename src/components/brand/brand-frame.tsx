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
    <div className="pce-wash flex min-h-screen flex-col items-center px-5 pb-16 pt-10">
      <Image
        src={brand.logo}
        alt={brand.logoAlt}
        width={220}
        height={124}
        priority
        className="mb-7 h-auto w-[220px]"
      />
      <div className={cn("w-full", className)}>{children}</div>
      <p className="mt-6 text-center text-[13.5px] text-pce-muted">
        {brand.longName} ·{" "}
        <a href={brand.phoneHref} className="font-bold text-pce-coral hover:text-pce-red-deep">
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
        "w-full rounded-2xl border border-pce-line border-b-[5px] border-b-pce-teal bg-white px-9 py-11 shadow-[0_20px_50px_rgba(0,40,70,0.14)]",
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
        "pce-navy-card w-full rounded-2xl border-b-[5px] border-b-pce-teal px-9 py-10 shadow-[0_20px_50px_rgba(0,40,70,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const kitButton = {
  primary:
    "inline-flex items-center justify-center rounded-xl border border-pce-red-deep border-b-4 bg-pce-coral px-8 pb-[15px] pt-[18px] font-display text-[19px] leading-none tracking-[0.5px] text-white transition-colors hover:border-pce-coral hover:bg-pce-red-deep disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center rounded-xl border border-pce-navy border-b-4 bg-white px-6 pb-[11px] pt-[14px] font-display text-[15px] leading-none tracking-[0.5px] text-pce-navy transition-colors hover:bg-pce-sky disabled:opacity-60",
  ghostOnNavy:
    "inline-flex items-center justify-center rounded-xl border border-white border-b-4 bg-transparent px-5 pb-[9px] pt-3 font-display text-sm leading-none text-white transition-colors hover:bg-white/10",
  input:
    "w-full rounded-xl border border-pce-teal border-b-4 bg-white px-4 pb-3 pt-3.5 text-[15.5px] text-pce-ink outline-none placeholder:text-pce-muted focus:border-pce-navy focus:ring-[3px] focus:ring-pce-teal/45",
  inputOnNavy:
    "w-full rounded-xl border border-pce-navy bg-white px-4 pb-3 pt-3.5 text-[15.5px] text-pce-ink outline-none placeholder:text-pce-muted focus:border-pce-teal focus:ring-[3px] focus:ring-pce-teal/55",
};
