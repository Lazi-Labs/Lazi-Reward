import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  MessageSquareWarning,
  Send,
  Star,
  ThumbsUp,
} from "lucide-react";

import { FilterBar } from "@/components/admin/filter-bar";
import { FunnelBars, KpiTile, RatingBars } from "@/components/admin/kpi";
import { getAdminStats } from "@/lib/admin";
import {
  getBusinessBreakdown,
  getGiftMetrics,
  getReviewFunnel,
  listRecentActivity,
  parsePeriod,
  periodStart,
} from "@/lib/admin-metrics";
import { getBalance, isTremendousConfigured, isTremendousSandbox } from "@/lib/tremendous";
import { cn } from "@/lib/utils";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const rel = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

function ago(d: Date) {
  const mins = Math.round((d.getTime() - Date.now()) / 60000);
  if (Math.abs(mins) < 60) return rel.format(mins, "minute");
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return rel.format(hrs, "hour");
  return rel.format(Math.round(hrs / 24), "day");
}

const KIND_STYLE: Record<string, string> = {
  request: "bg-pce-sky text-pce-navy",
  opened: "bg-pce-sky text-pce-navy",
  rating: "bg-[#FFF3D6] text-[#8a5a00]",
  gift: "bg-pce-teal/15 text-pce-teal-dark",
  callback: "bg-pce-cream text-pce-red-deep",
};

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const days = parsePeriod(sp.days);
  const since = periodStart(days);
  const [stats, funnel, gifts, activity, byBiz, balance] = await Promise.all([
    getAdminStats(),
    getReviewFunnel(since),
    getGiftMetrics(since),
    listRecentActivity(14),
    getBusinessBreakdown(since),
    isTremendousConfigured() ? getBalance() : Promise.resolve(null),
  ]);
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
  const attention: { text: string; href: string }[] = [];
  if (funnel.openCallbacks) attention.push({ text: `${funnel.openCallbacks} customer${funnel.openCallbacks === 1 ? "" : "s"} asked for a manager callback`, href: "/admin/reviews?status=submitted" });
  if (gifts.failed) attention.push({ text: `${gifts.failed} gift card${gifts.failed === 1 ? "" : "s"} failed to order`, href: "/admin/gifts?status=failed" });
  if (!isTremendousConfigured()) attention.push({ text: "Tremendous is not configured — gifts can't be ordered", href: "/admin/reviews" });
  if (balance !== null && balance < 50 && !isTremendousSandbox()) attention.push({ text: `Tremendous balance is low (${money.format(balance)})`, href: "/admin/gifts" });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Review requests, ratings, and gift cards — last {days} days.
          </p>
        </div>
        <FilterBar periods={[7, 30, 90, 365]} className="border-0 bg-transparent p-0" />
      </div>

      {attention.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {attention.map((a) => (
            <li key={a.text}>
              <Link
                href={a.href}
                className="flex items-center gap-3 rounded-xl border border-pce-red-deep/30 bg-pce-cream/50 px-4 py-3 text-sm font-medium text-pce-ink transition-colors hover:bg-pce-cream"
              >
                <AlertTriangle className="size-4 flex-none text-pce-red-deep" aria-hidden />
                <span className="flex-1">{a.text}</span>
                <ArrowRight className="size-4 text-pce-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Requests sent" value={funnel.requests} hint={`${pct(funnel.opened, funnel.requests)} opened`} icon={Send} />
        <KpiTile
          label="Avg rating"
          value={funnel.avgRating ?? "—"}
          hint={`${funnel.rated} rated · ${pct(funnel.rated, funnel.opened)} of opens`}
          icon={Star}
          tone="good"
        />
        <KpiTile label="Sent to Google" value={funnel.sentToGoogle} hint="4–5★ customers shown the Google ask" icon={ThumbsUp} />
        <KpiTile
          label="Gift cards"
          value={money.format(gifts.spent)}
          hint={`${gifts.ordered} ordered · ${gifts.offered} waiting${isTremendousSandbox() ? " · sandbox" : ""}`}
          icon={Gift}
          tone="brand"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Review funnel</h2>
          <FunnelBars
            steps={[
              { label: "Requests created", value: funnel.requests },
              { label: "Sent", value: funnel.sent },
              { label: "Opened the link", value: funnel.opened },
              { label: "Rated us", value: funnel.rated },
              { label: "Picked a gift card", value: gifts.ordered },
            ]}
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Ratings</h2>
          <RatingBars distribution={funnel.distribution} />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-pce-muted">
            <MessageSquareWarning className="size-3.5" aria-hidden />
            {funnel.needsAttention} low rating{funnel.needsAttention === 1 ? "" : "s"} went to the questionnaire
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link href="/admin/reviews" className="text-xs font-medium text-pce-coral hover:underline">
              All requests →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — create a review request.</p>
          ) : (
            <ul className="divide-y">
              {activity.map((a) => {
                const inner = (
                  <>
                    <span className={cn("mt-0.5 flex size-7 flex-none items-center justify-center rounded-full text-[11px] font-bold", KIND_STYLE[a.kind])} aria-hidden>
                      {a.kind === "rating" ? a.rating : a.kind === "gift" ? "$" : a.kind === "callback" ? "!" : a.kind === "opened" ? "👁" : "→"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-pce-ink">{a.title}</span>
                      {a.detail ? <span className="block text-xs text-pce-muted">{a.detail}</span> : null}
                    </span>
                    <time className="flex-none text-xs text-pce-muted" dateTime={a.at.toISOString()}>
                      {ago(a.at)}
                    </time>
                  </>
                );
                return (
                  <li key={a.id}>
                    {a.href ? (
                      <Link href={a.href} className="flex items-start gap-3 py-2.5 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-lg">
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 py-2.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">By business</h2>
            <ul className="space-y-3">
              {byBiz.map((b) => (
                <li key={b.id} className="text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{b.name}</span>
                    <span className="text-xs text-pce-muted">{money.format(b.spent)} in gifts</span>
                  </div>
                  <p className="text-xs text-pce-muted">
                    {b.requests} requests · {pct(b.opened, b.requests)} opened · {b.gifts} gifts
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4 text-sm">
            <h2 className="mb-2 text-sm font-semibold">All time</h2>
            <p className="text-pce-body">{stats.totalContacts} contacts · {stats.totalReferrals} referrals · {stats.completedReferrals} completed</p>
            <p className="mt-1 text-xs text-pce-muted">
              Tremendous {isTremendousSandbox() ? "sandbox" : "balance"}: {balance === null ? "—" : money.format(balance)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
