import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandFrame } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";
import { getBusinessBySlug, googleReviewUrlFor } from "@/lib/reviews";

import { ReviewFunnel } from "../review-funnel";

export const dynamic = "force-dynamic";

type Params = Promise<{ business: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { business } = await params;
  const brand = brandFor(business);
  return {
    title: `How did we do? · ${brand.name}`,
    robots: { index: false, follow: false },
  };
}

/**
 * Generic review hosting page for one business — the link that goes on QR
 * codes, invoices, and bulk texts when there's no per-customer token.
 */
export default async function BusinessReviewPage({ params }: { params: Params }) {
  const { business } = await params;
  const biz = await getBusinessBySlug(business);
  if (!biz) notFound();
  const brand = brandFor(biz.slug);

  return (
    <BrandFrame brand={brand}>
      <ReviewFunnel
        businessSlug={biz.slug}
        businessName={brand.name}
        token={null}
        googleUrl={googleReviewUrlFor(biz)}
        contactFirstName={null}
      />
    </BrandFrame>
  );
}
