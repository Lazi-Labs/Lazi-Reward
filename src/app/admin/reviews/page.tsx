import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reviewBaseUrl } from "@/lib/brand";
import { getRequestOrigin } from "@/lib/referrals";
import {
  REVIEW_REQUEST_STATUS_LABEL,
  listActiveBusinesses,
  listRecentFeedback,
  listReviewRequests,
  reviewLinkFor,
} from "@/lib/reviews";

import { CopyButton } from "./copy-button";
import { ReviewRequestForm } from "./request-form";

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive"> = {
  queued: "secondary",
  sent: "secondary",
  clicked: "default",
  submitted: "default",
  failed: "destructive",
};

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminReviewsPage() {
  const [bizList, requests, feedback, origin] = await Promise.all([
    listActiveBusinesses(),
    listReviewRequests(),
    listRecentFeedback(),
    getRequestOrigin(),
  ]);
  const base = reviewBaseUrl(origin);
  const configured = Boolean(process.env.NEXT_PUBLIC_REVIEW_BASE_URL);
  const hosted = await Promise.all(
    bizList.map(async (b) => ({ ...b, link: await reviewLinkFor(b.slug) })),
  );

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Review hosting links, per-customer review requests, and the feedback that comes back.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Review hosting</CardTitle>
            <CardDescription>
              These pages are what customers land on when they tap a review request. Put the
              business link on QR codes and invoices; use the form to mint a per-customer link
              that tracks who responded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <span className="font-medium">Hosting domain:</span>{" "}
              <code className="font-mono">{base}</code>
              {configured ? (
                <Badge className="ml-2" variant="secondary">
                  NEXT_PUBLIC_REVIEW_BASE_URL
                </Badge>
              ) : (
                <span className="ml-2 text-muted-foreground">
                  (app origin — set <code>NEXT_PUBLIC_REVIEW_BASE_URL</code> once the review
                  domain is attached on Vercel)
                </span>
              )}
            </div>
            <ul className="divide-y rounded-lg border">
              {hosted.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{b.name}</p>
                    <code className="block truncate font-mono text-xs text-muted-foreground">
                      {b.link}
                    </code>
                    {!b.gmbUrl && (
                      <p className="mt-1 text-xs text-pce-red-deep">
                        No Google review URL on this business — happy customers see a thank-you
                        instead of the Google step.
                      </p>
                    )}
                  </div>
                  <CopyButton value={b.link} />
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-sm hover:bg-muted"
                  >
                    <ExternalLink className="size-4" /> Open
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New review request</CardTitle>
            <CardDescription>Creates the contact if needed and mints a tracked link.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewRequestForm businesses={bizList.map((b) => ({ id: b.id, name: b.name }))} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Review requests</h2>
          <p className="text-sm text-muted-foreground">
            Status moves automatically: link ready → opened → responded.
          </p>
        </div>
        {requests.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No review requests yet — create one above.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Opened</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.contactPhone ?? r.contactEmail ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{r.businessName}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[r.status] ?? "secondary"}>
                      {REVIEW_REQUEST_STATUS_LABEL[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {fmt(r.createdAt)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {fmt(r.clickedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <CopyButton value={`${base}/review/${r.businessSlug}/${r.token}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Feedback received</h2>
          <p className="text-sm text-muted-foreground">
            Every star rating lands here. Low scores that asked for a callback also create a task.
          </p>
        </div>
        {feedback.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nothing yet.
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {feedback.map((f) => (
              <li key={f.id} className="rounded-xl border bg-card p-4 text-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[#F5A623]">
                    {"★".repeat(f.rating ?? 0)}
                    <span className="text-pce-line">{"★".repeat(5 - (f.rating ?? 0))}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{fmt(f.createdAt)}</span>
                </div>
                <p className="font-medium">
                  {f.contactName ?? "Anonymous"}{" "}
                  <span className="font-normal text-muted-foreground">· {f.businessName}</span>
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                  {f.content}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
