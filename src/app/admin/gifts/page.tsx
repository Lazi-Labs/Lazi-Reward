import Link from "next/link";
import { Download } from "lucide-react";

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
import { getGiftMetrics, parsePeriod, periodStart } from "@/lib/admin-metrics";
import { GIFT_STATUS_LABEL, listGiftCards } from "@/lib/gifts";
import { listActiveBusinesses } from "@/lib/reviews";
import { getBalance, isTremendousConfigured, isTremendousSandbox } from "@/lib/tremendous";

import { CopyButton } from "../reviews/copy-button";
import { GiftCell } from "../reviews/gift-cell";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  offered: "outline",
  created: "secondary",
  delivered: "default",
  failed: "destructive",
  canceled: "destructive",
};

export default async function AdminGiftsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const days = parsePeriod(sp.days);
  const since = periodStart(days);
  const [bizList, metrics, rows, balance] = await Promise.all([
    listActiveBusinesses(),
    getGiftMetrics(since, sp.business),
    listGiftCards({ since, status: sp.status, businessId: sp.business, q: sp.q, limit: 200 }),
    isTremendousConfigured() ? getBalance() : Promise.resolve(null),
  ]);
  const exportHref = `/admin/gifts/export?${new URLSearchParams(
    Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>,
  ).toString()}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gift cards</h1>
          <p className="text-sm text-muted-foreground">
            Every thank-you gift: offered with the request, ordered when the customer picks a card.
            {isTremendousSandbox() ? " Sandbox — test money." : ""}
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          <Download className="size-4" aria-hidden /> Export CSV
        </a>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiTile label="Spent" value={money.format(metrics.spent)} hint={`Last ${days} days`} tone="brand" />
        <KpiTile label="Ordered" value={metrics.ordered} hint="Customer picked a card" tone="good" />
        <KpiTile label="Waiting" value={metrics.offered} hint="Offered, not picked yet" />
        <KpiTile
          label="Failed"
          value={metrics.failed}
          hint={metrics.failed ? "Retry from the table" : "Nothing to fix"}
          tone={metrics.failed ? "warn" : "default"}
        />
        <KpiTile
          label="Balance"
          value={balance === null ? "—" : money.format(balance)}
          hint={isTremendousConfigured() ? "Tremendous funds" : "Not configured"}
        />
      </section>

      {metrics.byProduct.length ? (
        <section className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-pce-muted">
            What customers pick
          </p>
          <ul className="flex flex-wrap gap-2">
            {metrics.byProduct.map((p) => (
              <li key={p.product} className="rounded-full border bg-background px-3 py-1.5 text-sm">
                <span className="font-medium">{p.product}</span>{" "}
                <span className="text-pce-muted">
                  · {p.n} · {money.format(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <FilterBar
        searchParam="q"
        searchPlaceholder="Search customer…"
        selects={[
          {
            param: "status",
            label: "Statuses",
            options: Object.entries(GIFT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
          },
          {
            param: "business",
            label: "Businesses",
            options: bizList.map((b) => ({ value: b.id, label: b.name })),
          },
        ]}
        periods={[7, 30, 90, 365]}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No gifts match these filters.
        </div>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map((g) => (
              <li key={g.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.businessName} · {fmt.format(g.createdAt)}
                    </p>
                  </div>
                  <Badge variant={TONE[g.status] ?? "secondary"}>
                    ${Number(g.amount).toFixed(0)} · {GIFT_STATUS_LABEL[g.status]}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-pce-body">
                  {g.productName ? <span>{g.productName}</span> : <span>No card picked yet</span>}
                  {g.failureReason ? (
                    <span className="text-pce-red-deep">{g.failureReason}</span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.redemptionLink ? <CopyButton value={g.redemptionLink} label="Copy gift link" /> : null}
                  {g.reviewRequestId ? (
                    <Link
                      href={`/admin/reviews/${g.reviewRequestId}`}
                      className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted"
                    >
                      Request
                    </Link>
                  ) : null}
                  {g.status === "failed" ? (
                    <GiftCell
                      gift={{
                        id: g.id,
                        status: g.status,
                        amount: g.amount,
                        redemptionLink: g.redemptionLink,
                        failureReason: g.failureReason,
                      }}
                    />
                  ) : null}
                </div>
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
                  <TableHead>Card</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="hidden lg:table-cell">Sent via</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.contactName}</TableCell>
                    <TableCell className="text-muted-foreground">{g.businessName}</TableCell>
                    <TableCell>
                      {g.productName ?? <span className="text-muted-foreground">—</span>}
                      {g.failureReason ? (
                        <p className="max-w-[28ch] truncate text-xs text-pce-red-deep" title={g.failureReason}>
                          {g.failureReason}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <GiftCell
                        gift={{
                          id: g.id,
                          status: g.status,
                          amount: g.amount,
                          redemptionLink: null,
                          failureReason: g.failureReason,
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmt.format(g.createdAt)}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {g.deliveryChannel ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex gap-1.5">
                        {g.redemptionLink ? <CopyButton value={g.redemptionLink} label="Gift link" /> : null}
                        {g.reviewRequestId ? (
                          <Link
                            href={`/admin/reviews/${g.reviewRequestId}`}
                            className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted"
                          >
                            Request
                          </Link>
                        ) : null}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
