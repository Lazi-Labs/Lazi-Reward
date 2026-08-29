import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BrandFrame } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";
import { getGiftForReviewRequest, productsForGift } from "@/lib/gifts";
import {
  emitRequestEvent,
  getReviewRequestByToken,
  googleReviewUrlFor,
  markReviewRequestClicked,
} from "@/lib/reviews";

import { ReviewFunnel } from "../../review-funnel";

export const dynamic = "force-dynamic";

type Params = Promise<{ business: string; token: string }>;
type Search = Promise<{ rating?: string }>;

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
 * text/email. Knows who they are, so the outcome lands on their contact and
 * their thank-you gift (if issued) is shown.
 */
export default async function TokenReviewPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { business, token } = await params;
  const { rating } = await searchParams;
  const initialRating = [1, 2, 3, 4, 5].includes(Number(rating)) ? Number(rating) : null;
  const req = await getReviewRequestByToken(token);
  if (!req) notFound();
  if (req.business.slug !== business) {
    redirect(`/review/${req.business.slug}/${token}`);
  }

  const [gift] = await Promise.all([
    getGiftForReviewRequest(req.id),
    markReviewRequestClicked(req.id).catch((err) =>
      console.error("Failed to mark review request clicked", err),
    ),
    req.status !== "clicked" && req.status !== "submitted"
      ? emitRequestEvent(req.id, "review_request.opened", {})
      : Promise.resolve(),
  ]);

  const brand = brandFor(req.business.slug);
  const firstName = req.contact.name?.split(" ")[0] ?? null;
  const showGift = gift && gift.status !== "canceled";
  const products = showGift && !gift.redemptionLink ? await productsForGift(gift) : [];

  return (
    <BrandFrame brand={brand}>
      <ReviewFunnel
        businessSlug={req.business.slug}
        businessName={brand.name}
        token={token}
        googleUrl={googleReviewUrlFor(req.business)}
        contactFirstName={firstName}
        initialRating={initialRating}
        gift={
          showGift && (gift.redemptionLink || products.length > 0)
            ? {
                amount: Number(gift.amount),
                link: gift.redemptionLink,
                productName: gift.productName,
                products,
              }
            : null
        }
      />
    </BrandFrame>
  );
}
