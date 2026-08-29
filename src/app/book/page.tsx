import type { Metadata } from "next";
import { cookies } from "next/headers";

import { BrandFrame } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";
import { SERVICE_OPTIONS } from "@/lib/servicetitan";
import { REFERRAL_COOKIE_NAME } from "@/lib/users";

import { referralPreview } from "./actions";
import { BookingWizard } from "./booking-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a service · Perfect Catch",
  robots: { index: false },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const code = (sp.ref || cookieStore.get(REFERRAL_COOKIE_NAME)?.value || "").trim();
  const referral = code ? await referralPreview(code) : null;
  const brand = brandFor(null);

  return (
    <BrandFrame brand={brand}>
      <BookingWizard brand={brand} services={SERVICE_OPTIONS} referral={referral} />
    </BrandFrame>
  );
}
