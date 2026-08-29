import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getReviewRequestDetail, REVIEW_REQUEST_STATUS_LABEL, reviewLinkFor } from "@/lib/reviews";
import { GIFT_STATUS_LABEL } from "@/lib/gifts";
import { cn } from "@/lib/utils";

import { CopyButton } from "../copy-button";
import { GiftCell } from "../gift-cell";
import { MarkSentButton } from "../mark-sent";

const fmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function Step({ label, at, done, detail }: { label: string; at?: Date | null; done: boolean; detail?: string | null }) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-6 flex-none items-center justify-center rounded-full border",
          done ? "border-pce-teal bg-pce-teal text-white" : "border-pce-line text-pce-line",
        )}
        aria-hidden
      >
        {done ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
      </span>
      <div className="min-w-0 pb-4">
        <p className={cn("text-sm font-medium", done ? "text-pce-ink" : "text-pce-muted")}>{label}</p>
        <p className="text-xs text-pce-muted">{at ? fmt.format(at) : done ? "" : "Not yet"}</p>
        {detail ? <p className="mt-1 whitespace-pre-wrap text-sm text-pce-body">{detail}</p> : null}
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm">
      <span className="text-pce-muted">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}

export default async function ReviewRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getReviewRequestDetail(id);
  if (!d) notFound();
  const { request: r, gift, latestReview, callbacks } = d;
  const link = await reviewLinkFor(r.business.slug, r.token);
  const meta = (r.metadata ?? {}) as Record<string, unknown>;
  const refs = r.contact.externalRefs ?? {};

  return (
    <>
      <div>
        <Link
          href="/admin/reviews"
          className="mb-2 inline-flex items-center gap-1 text-sm text-pce-muted hover:text-pce-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> Reviews
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{r.contact.name}</h1>
          <Badge variant="secondary">{REVIEW_REQUEST_STATUS_LABEL[r.status]}</Badge>
          {gift ? (
            <Badge variant={gift.status === "failed" ? "destructive" : "outline"}>
              Gift · {GIFT_STATUS_LABEL[gift.status]}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {r.business.name} · created {fmt.format(r.createdAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={link} label="Copy review link" variant="default" size="default" />
        <a
          href={link}
          target="_blank"
          rel="noopener"
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm hover:bg-muted"
        >
          Open link
        </a>
        {r.status === "queued" ? <MarkSentButton requestId={r.id} giftId={gift?.id ?? null} /> : null}
        <Link
          href={`/admin/contacts/${r.contactId}`}
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm hover:bg-muted"
        >
          Contact record
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">Journey</h2>
          <ol>
            <Step label="Request created" at={r.createdAt} done />
            <Step label="Sent to customer" at={r.sentAt} done={Boolean(r.sentAt) || r.status !== "queued"} />
            <Step label="Opened the link" at={r.clickedAt} done={Boolean(r.clickedAt)} />
            <Step
              label={latestReview ? `Rated ${latestReview.rating}/5` : "Rated us"}
              at={latestReview?.createdAt}
              done={Boolean(latestReview)}
              detail={latestReview?.content}
            />
            <Step
              label={
                gift?.productName ? `Picked ${gift.productName}` : gift ? "Pick a gift card" : "No gift on this request"
              }
              at={gift?.status === "created" || gift?.status === "delivered" ? gift.updatedAt : null}
              done={gift?.status === "created" || gift?.status === "delivered"}
              detail={gift?.failureReason ? `Failed: ${gift.failureReason}` : null}
            />
            {callbacks.length ? (
              <Step
                label="Manager callback requested"
                at={callbacks[0].createdAt}
                done
                detail={callbacks[0].completedAt ? "Completed" : "Open — due within 1 business day"}
              />
            ) : null}
          </ol>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Gift card</h2>
            {gift ? (
              <div className="space-y-2">
                <GiftCell
                  gift={{
                    id: gift.id,
                    status: gift.status,
                    amount: gift.amount,
                    redemptionLink: gift.redemptionLink,
                    failureReason: gift.failureReason,
                  }}
                />
                <Row label="Card" value={gift.productName ?? "Not picked yet"} />
                <Row label="Order" value={gift.tremendousOrderId ?? "—"} />
                <Row label="Sent via" value={gift.deliveryChannel ?? "—"} />
                <Row label="Delivered" value={gift.deliveredAt ? fmt.format(gift.deliveredAt) : "—"} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Gifts are disabled for this business.</p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Customer</h2>
            <div className="space-y-1.5">
              <Row label="Phone" value={r.contact.phone ?? "—"} />
              <Row label="Email" value={r.contact.email ?? "—"} />
              <Row label="Channel" value={r.channel} />
              {Object.entries(refs).map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, " ")} value={<code className="font-mono text-xs">{v}</code>} />
              ))}
            </div>
          </div>

          {Object.keys(meta).length ? (
            <div className="rounded-xl border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Job</h2>
              <div className="space-y-1.5">
                {Object.entries(meta).map(([k, v]) => (
                  <Row
                    key={k}
                    label={k.replace(/^st_/, "").replace(/_/g, " ")}
                    value={
                      k === "invoice_total" && typeof v === "number"
                        ? `$${v.toLocaleString()}`
                        : String(v)
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
