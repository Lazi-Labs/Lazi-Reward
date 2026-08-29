import type { BusinessBrand } from "@/lib/brand";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Review-request copy. Compliance rule (design/README.md): the gift is a
 * thank-you for the job and is never conditioned on leaving a review — the
 * review ask is a separate favor. The customer picks their gift card on the
 * same page, so there is one link.
 */
export function buildReviewRequestMessage(args: {
  brand: BusinessBrand;
  firstName: string | null;
  reviewLink: string;
  giftAmount: number | null;
}) {
  const hi = args.firstName ? `Hi ${args.firstName},` : "Hi,";
  // Review-first order (2026-08-29): the rating ask leads; the gift is an
  // unconditional thank-you mentioned after it — never tied to what they say.
  if (args.giftAmount) {
    return [
      `${hi} it's Yanni from ${args.brand.name} 👋 How did we do? Tap to rate your visit — one tap, honest answer: ${args.reviewLink}`,
      `A ${money.format(args.giftAmount)} thank-you from the crew is waiting right after, whatever you tell us.`,
    ].join("\n");
  }
  return `${hi} it's Yanni from ${args.brand.name} 👋 How did we do? Tap to rate your visit — one tap, honest answer: ${args.reviewLink}`;
}

export function buildReviewRequestEmail(args: Parameters<typeof buildReviewRequestMessage>[0]) {
  const text = buildReviewRequestMessage(args);
  const html = text
    .split("\n")
    .map(
      (l) =>
        `<p style="font:16px/1.5 Arial,sans-serif;color:#001E33;margin:0 0 12px">${l.replace(
          /(https?:\/\/\S+)/g,
          '<a href="$1" style="color:#F24E45;font-weight:700">$1</a>',
        )}</p>`,
    )
    .join("");
  return {
    subject: `Thank you from ${args.brand.name}`,
    text,
    html: `<div style="padding:24px">${html}<p style="font:13px Arial,sans-serif;color:#706F6F">${args.brand.longName} · ${args.brand.phone}</p></div>`,
  };
}
