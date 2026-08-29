import type { BusinessBrand } from "@/lib/brand";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Review-request copy. Compliance rule (design/README.md): the gift is a
 * thank-you for the job and is never conditioned on leaving a review — the
 * review ask is a separate favor. Keep it that way when editing.
 */
export function buildReviewRequestMessage(args: {
  brand: BusinessBrand;
  firstName: string | null;
  reviewLink: string;
  giftLink: string | null;
  giftAmount: number | null;
}) {
  const hi = args.firstName ? `Hi ${args.firstName},` : "Hi,";
  const lines = [`${hi} thanks for choosing ${args.brand.name}!`];
  if (args.giftLink && args.giftAmount) {
    lines.push(
      `Here's a ${money.format(args.giftAmount)} thank-you from our crew — pick your gift card here: ${args.giftLink}`,
    );
  }
  lines.push(`If you have 60 seconds, we'd love to hear how we did: ${args.reviewLink}`);
  return lines.join("\n");
}

export function buildReviewRequestEmail(args: Parameters<typeof buildReviewRequestMessage>[0]) {
  const text = buildReviewRequestMessage(args);
  const html = text
    .split("\n")
    .map((l) => `<p style="font:16px/1.5 Arial,sans-serif;color:#001E33;margin:0 0 12px">${l.replace(
      /(https?:\/\/\S+)/g,
      '<a href="$1" style="color:#F24E45;font-weight:700">$1</a>',
    )}</p>`)
    .join("");
  return {
    subject: `Thank you from ${args.brand.name}`,
    text,
    html: `<div style="padding:24px">${html}<p style="font:13px Arial,sans-serif;color:#706F6F">${args.brand.longName} · ${args.brand.phone}</p></div>`,
  };
}
