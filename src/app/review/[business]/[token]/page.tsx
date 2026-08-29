import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BrandFrame } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";
import {
  getReviewRequestByToken,
  googleReviewUrlFor,
  markReviewRequestClicked,
} from "@/lib/reviews";

import { ReviewFunnel } from "../../review-funnel";

export const dynamic = "force-dynamic";

type Params = Promise<{ business: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { business } = await params;
  const brand = brandFor(business);
  return {
    title: `How did we do? · ${brand.name}`,
    robots: { index: false, follow: false },
  };
}

/**
 * Tokenized review link — what a customer receives in their review request
 * text/email. Knows who they are, so the outcome lands on their contact.
 */
export default async function TokenReviewPage({ params }: { params: Params }) {
  const { business, token } = await params;
  const req = await getReviewRequestByToken(token);
  if (!req) notFound();
  if (req.business.slug !== business) {
    redirect(`/review/${req.business.slug}/${token}`);
  }

  try {
    await markReviewRequestClicked(req.id);
  } catch (err) {
    console.error("Failed to mark review request clicked", err);
  }

  const brand = brandFor(req.business.slug);
  const firstName = req.contact.name?.split(" ")[0] ?? null;

  return (
    <BrandFrame brand={brand}>
      <ReviewFunnel
        businessSlug={req.business.slug}
        businessName={brand.name}
        token={token}
        googleUrl={googleReviewUrlFor(req.business)}
        contactFirstName={firstName}
      />
    </BrandFrame>
  );
}
