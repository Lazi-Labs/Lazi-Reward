import { desc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";

import { db } from "@/db";
import { referrers, reviewRequests } from "@/db/schema";
import { getRequestOrigin } from "@/lib/referrals";
import { listActiveBusinesses, reviewLinkFor } from "@/lib/reviews";

import { CopyButton } from "../reviews/copy-button";
import { DevicePreview } from "./device-preview";

type PreviewItem = {
  key: string;
  title: string;
  description: string;
  url: string | null;
  emptyHint?: string;
};

export default async function AdminPreviewPage() {
  const [bizList, origin, latestRequest, anyReferrer] = await Promise.all([
    listActiveBusinesses(),
    getRequestOrigin(),
    db.query.reviewRequests.findFirst({
      orderBy: desc(reviewRequests.createdAt),
      with: { business: true, contact: true },
    }),
    db.query.referrers.findFirst({ orderBy: desc(referrers.createdAt) }),
  ]);
  const biz = bizList[0];
  const businessLink = biz ? await reviewLinkFor(biz.slug) : null;
  const customerLink = latestRequest
    ? await reviewLinkFor(latestRequest.business.slug, latestRequest.token)
    : null;
  const app = origin.replace(/\/+$/, "");

  const items: PreviewItem[] = [
    {
      key: "review-customer",
      title: "Review request (customer link)",
      description: latestRequest
        ? `What ${latestRequest.contact.name} received — the tokenized link with the $10 gift. This is the newest request.`
        : "The tokenized link a customer receives, with the gift. Create a review request to preview one.",
      url: customerLink,
      emptyHint: "No review requests yet.",
    },
    {
      key: "review-business",
      title: "Review page (business link)",
      description:
        "The generic link for QR codes and invoices — no customer identity, so no gift is shown.",
      url: businessLink,
    },
    {
      key: "referral-landing",
      title: "Referral link (what a friend sees)",
      description: anyReferrer
        ? "A real referral code — the landing page a friend gets when a customer shares their link."
        : "The landing page a friend gets. Sign in to the customer dashboard once to create a referral code.",
      url: anyReferrer ? `${app}/r/${anyReferrer.referralCode}` : null,
      emptyHint: "No referral codes yet.",
    },
    {
      key: "referral-dashboard",
      title: "Referral dashboard (signed-in customer)",
      description:
        "Where customers share their link, submit referrals, and claim rewards. The preview uses your own login.",
      url: `${app}/dashboard`,
    },
    {
      key: "home",
      title: "Home page",
      description: "Public landing at the app root.",
      url: `${app}/`,
    },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Preview</h1>
        <p className="text-sm text-muted-foreground">
          The customer-facing pages, exactly as they render today. Each preview is live — interact with
          it to walk the flow (ratings and gift picks in a preview are real, so use a test request).
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {items.map((it) => (
          <section key={it.key} className="flex flex-col rounded-xl border bg-card">
            <div className="border-b p-4">
              <h2 className="text-sm font-semibold">{it.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{it.description}</p>
              {it.url ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-[11px]">
                    {it.url}
                  </code>
                  <CopyButton value={it.url} />
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-sm hover:bg-muted"
                  >
                    <ExternalLink className="size-4" aria-hidden /> Open
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-xs text-pce-red-deep">{it.emptyHint}</p>
              )}
            </div>
            {it.url ? <DevicePreview url={it.url} title={it.title} /> : null}
          </section>
        ))}
      </div>
    </>
  );
}
