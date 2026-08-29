/**
 * Brand configuration per business.
 *
 * Colors and type live in src/app/globals.css (mirroring styles.css in the
 * "PCE Website" Claude Design project — see design/README.md). This file holds
 * the per-business facts the review funnel and referral cards need at runtime.
 */

export type BusinessBrand = {
  slug: string;
  name: string;
  /** Full legal/marketing name shown in footers. */
  longName: string;
  phone: string;
  phoneHref: string;
  logo: string; // public path
  logoAlt: string;
  /** Fallback Google review URL when businesses.gmb_url is null. */
  googleReviewUrl: string | null;
  /** Public website the referral share copy points to. */
  website: string;
};

export const BRANDS: Record<string, BusinessBrand> = {
  "perfect-catch-electric": {
    slug: "perfect-catch-electric",
    name: "Perfect Catch",
    longName: "Perfect Catch Swimming Pool Repair, Gas & Electric",
    phone: "727-316-5206",
    phoneHref: "tel:7273165206",
    logo: "/brand/pce-logo-full.webp",
    logoAlt: "Perfect Catch Swimming Pool Repair, Gas & Electric",
    googleReviewUrl: "https://g.page/r/CUDCVygcLSPwEBM/review",
    website: "https://callperfectcatch.com",
  },
  "liv-pools": {
    slug: "liv-pools",
    name: "LIV Pools",
    longName: "LIV Pools",
    phone: "727-316-5206",
    phoneHref: "tel:7273165206",
    logo: "/brand/pce-logo-full.webp",
    logoAlt: "LIV Pools",
    googleReviewUrl: null,
    website: "https://livpools.com",
  },
};

export const DEFAULT_BRAND_SLUG = "perfect-catch-electric";

export function brandFor(slug: string | null | undefined): BusinessBrand {
  return BRANDS[slug ?? ""] ?? BRANDS[DEFAULT_BRAND_SLUG];
}

/**
 * Base URL customers hit when they click a review request. Set
 * NEXT_PUBLIC_REVIEW_BASE_URL on Vercel once the dedicated review domain is
 * attached (e.g. https://review.callperfectcatch.com); until then links fall
 * back to the app origin.
 */
export function reviewBaseUrl(fallbackOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_REVIEW_BASE_URL?.trim();
  return (configured || fallbackOrigin).replace(/\/+$/, "");
}

/** Payout options shared by the review promo and the referral reward claim. */
export type PayoutOption = {
  id: string;
  name: string;
  note: string;
  group: "card" | "deposit";
};

export const PAYOUT_OPTIONS: PayoutOption[] = [
  { id: "mastercard", name: "Prepaid Mastercard", note: "Reloadable · Anywhere", group: "card" },
  { id: "amazon", name: "Amazon Gift Card", note: "Email · Instant", group: "card" },
  { id: "venmo", name: "Venmo", note: "Sent to your @username", group: "deposit" },
  { id: "cashapp", name: "Cash App", note: "Sent to your $cashtag", group: "deposit" },
  { id: "bank", name: "Bank Transfer", note: "Direct deposit", group: "deposit" },
  { id: "charity", name: "Donate to Charity", note: "Pick a cause", group: "deposit" },
];

export const PAYOUT_IDS = PAYOUT_OPTIONS.map((o) => o.id) as [string, ...string[]];

export function payoutById(id: string | null | undefined): PayoutOption {
  return PAYOUT_OPTIONS.find((o) => o.id === id) ?? PAYOUT_OPTIONS[0];
}

/** Review-funnel questionnaire, in display order. */
export const FEEDBACK_QUESTIONS = [
  "Technician performance",
  "Office communication",
  "Estimate clarity",
  "Job completion",
  "Scheduling & punctuality",
  "Overall value for price",
] as const;

/** Ratings at or above this go to the Google step; below go to feedback. */
export const REVIEW_GATE = 4;
