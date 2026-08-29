import Link from "next/link";
import { ChevronRight, ExternalLink, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/admin/filter-bar";
import { KpiTile } from "@/components/admin/kpi";
import { getReviewFunnel, parsePeriod, periodStart } from "@/lib/admin-metrics";
import { reviewBaseUrl } from "@/lib/brand";
import { isSmsConfigured } from "@/lib/notify";
import { getRequestOrigin } from "@/lib/referrals";
import {
  REVIEW_REQUEST_STATUS_LABEL,
  listActiveBusinesses,
  listRecentFeedback,
  listReviewRequests,
  reviewLinkFor,
} from "@/lib/reviews";
import { isTremendousConfigured, isTremendousSandbox } from "@/lib/tremendous";

import { CopyButton } from "./copy-button";
import { GiftCell } from "./gift-cell";
import { MarkSentButton } from "./mark-sent";
import { ReviewRequestForm } from "./request-form";

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  sent: "secondary",
  clicked: "secondary",
  submitted: "default",
  failed: "destructive",
};

const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const days = parsePeriod(sp.days);
  const since = periodStart(days);
  const [bizList, requests, feedback, origin, funnel] = await Promise.all([
    listActiveBusinesses(),
    listReviewRequests({ since, status: sp.status, businessId: sp.business, q: sp.q, limit: 200 }),
    listRecentFeedback(20),
    getRequestOrigin(),
    getReviewFunnel(since, sp.business),
  ]);
  const base = reviewBaseUrl(origin);
  const hosted = await Promise.all(bizList.map(async (b) => ({ ...b, link: await reviewLinkFor(b.slug) })));
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Per-customer review requests, what came back, and the hosting links.
          </p>
        </div>
      </div>

      {!isTremendousConfigured() ? (
        <div className="rounded-xl border border-pce-red-deep/30 bg-pce-cream/40 px-4 py-3 text-sm">
          <span className="font-semibold text-pce-red-deep">Tremendous is not configured</span> — requests
          are created without a gift card.
        </div>
      ) : isTremendousSandbox() ? (
        <div className="rounded-xl border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Tremendous <strong>sandbox</strong> — gift links are test rewards.
          {isSmsConfigured() ? " Twilio auto-send is on." : " Twilio not set: requests are sent by GHL or “Text it”."}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Requests" value={funnel.requests} hint={`Last ${days} days`} />
        <KpiTile label="Opened" value={pct(funnel.opened, funnel.requests)} hint={`${funnel.opened} customers`} />
        <KpiTile label="Rated" value={funnel.rated} hint={funnel.avgRating ? `avg ${funnel.avgRating}★` : "—"} tone="good" />
        <KpiTile
          label="Callbacks open"
          value={funnel.openCallbacks}
          hint={funnel.openCallbacks ? "Call within 1 business day" : "All clear"}
          tone={funnel.openCallbacks ? "warn" : "default"}
        />
      </section>

      <FilterBar
        searchParam="q"
        searchPlaceholder="Search name, phone, email…"
        selects={[
          {
            param: "status",
            label: "Statuses",
            options: Object.entries(REVIEW_REQUEST_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
          { param: "business", label: "Businesses", options: bizList.map((b) => ({ value: b.id, label: b.name })) },
        ]}
        periods={[7, 30, 90, 365]}
      />

      <section className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No review requests match. Job-completed requests arrive automatically from ServiceTitan; you can
            also create one below.
          </div>
        ) : (
          <>
            {/* Phone: cards */}
            <ul className="space-y-2 md:hidden">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/reviews/${r.id}`}
                    className="block rounded-xl border bg-card p-3 transition-colors active:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.contactName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.contactPhone ?? r.contactEmail ?? "—"} · {r.businessName}
                        </p>
                      </div>
                      <ChevronRight className="size-4 flex-none text-pce-muted" aria-hidden />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant={STATUS_TONE[r.status] ?? "secondary"}>{REVIEW_REQUEST_STATUS_LABEL[r.status]}</Badge>
                      {r.gift ? (
                        <Badge variant={r.gift.status === "failed" ? "destructive" : "outline"}>
                          ${Number(r.gift.amount).toFixed(0)} ·{" "}
                          {r.gift.status === "offered" ? "waiting" : r.gift.status === "created" ? "ordered" : r.gift.status}
                        </Badge>
                      ) : null}
                      <span className="ml-auto text-xs text-muted-foreground">{fmt.format(r.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="hidden lg:table-cell">Opened</TableHead>
                    <TableHead className="text-right">Gift</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/admin/reviews/${r.id}`} className="font-medium hover:underline">
                          {r.contactName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{r.contactPhone ?? r.contactEmail ?? "—"}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.businessName}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_TONE[r.status] ?? "secondary"}>{REVIEW_REQUEST_STATUS_LABEL[r.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmt.format(r.createdAt)}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {r.clickedAt ? fmt.format(r.clickedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <GiftCell gift={r.gift} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          <CopyButton value={`${base}/review/${r.businessSlug}/${r.token}`} label="Link" />
                          {r.status === "queued" ? <MarkSentButton requestId={r.id} giftId={r.gift?.id ?? null} /> : null}
                          <Link
                            href={`/admin/reviews/${r.id}`}
                            className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted"
                          >
                            Details
                          </Link>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">New review request</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            For walk-ins or anything ServiceTitan didn&rsquo;t send. Creates the contact and offers the gift.
          </p>
          <ReviewRequestForm businesses={bizList.map((b) => ({ id: b.id, name: b.name }))} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <QrCode className="size-4 text-pce-muted" aria-hidden /> Hosting links
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Business-wide links for QR codes and invoices (no gift — no customer identity). Host:{" "}
              <code className="font-mono">{base}</code>
            </p>
            <ul className="divide-y">
              {hosted.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{b.name}</p>
                    <code className="block truncate font-mono text-[11px] text-muted-foreground">{b.link}</code>
                    {!b.gmbUrl ? (
                      <p className="text-xs text-pce-red-deep">No Google review URL — happy customers get a thank-you only.</p>
                    ) : null}
                  </div>
                  <CopyButton value={b.link} />
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Open ${b.name} review page`}
                    className="inline-flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Latest feedback</h2>
            <p className="mb-3 text-xs text-muted-foreground">Every rating, newest first. Low scores include the questionnaire.</p>
            {feedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {feedback.map((f) => (
                  <li key={f.id} className="rounded-lg border bg-background p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[#F5A623]" aria-label={`${f.rating} of 5 stars`}>
                        {"★".repeat(f.rating ?? 0)}
                        <span className="text-pce-line">{"★".repeat(5 - (f.rating ?? 0))}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{fmt.format(f.createdAt)}</span>
                    </div>
                    <p className="font-medium">
                      {f.contactName ?? "Anonymous"} <span className="font-normal text-muted-foreground">· {f.businessName}</span>
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">{f.content}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
