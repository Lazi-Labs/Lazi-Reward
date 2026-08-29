import { and, count, desc, eq, gte, isNotNull, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { businesses, contacts, giftCards, reviewRequests, reviews, tasks } from "@/db/schema";

export type Period = 7 | 30 | 90 | 365;

export function periodStart(days: Period) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parsePeriod(v: string | undefined): Period {
  const n = Number(v);
  return n === 7 || n === 30 || n === 90 || n === 365 ? n : 30;
}

export type ReviewFunnelMetrics = {
  requests: number;
  sent: number;
  opened: number;
  rated: number;
  avgRating: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  sentToGoogle: number;
  needsAttention: number;
  openCallbacks: number;
};

export async function getReviewFunnel(since: Date, businessId?: string): Promise<ReviewFunnelMetrics> {
  const reqWhere = and(
    gte(reviewRequests.createdAt, since),
    businessId ? eq(reviewRequests.businessId, businessId) : undefined,
  );
  const [reqRow] = await db
    .select({
      requests: count(),
      sent: sql<number>`COUNT(*) FILTER (WHERE ${reviewRequests.sentAt} IS NOT NULL OR ${reviewRequests.status} IN ('sent','clicked','submitted'))`,
      opened: sql<number>`COUNT(*) FILTER (WHERE ${reviewRequests.clickedAt} IS NOT NULL OR ${reviewRequests.status} IN ('clicked','submitted'))`,
    })
    .from(reviewRequests)
    .where(reqWhere);

  const revWhere = and(
    gte(reviews.createdAt, since),
    eq(reviews.source, "internal"),
    isNotNull(reviews.rating),
    businessId ? eq(reviews.businessId, businessId) : undefined,
  );
  const dist = await db
    .select({ rating: reviews.rating, n: count() })
    .from(reviews)
    .where(revWhere)
    .groupBy(reviews.rating);
  const distribution: ReviewFunnelMetrics["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let rated = 0;
  let sum = 0;
  for (const d of dist) {
    const r = Number(d.rating) as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      distribution[r] = Number(d.n);
      rated += Number(d.n);
      sum += r * Number(d.n);
    }
  }
  const [cb] = await db
    .select({ n: count() })
    .from(tasks)
    .where(and(like(tasks.title, "Manager callback%"), isNull(tasks.completedAt)));

  return {
    requests: Number(reqRow?.requests ?? 0),
    sent: Number(reqRow?.sent ?? 0),
    opened: Number(reqRow?.opened ?? 0),
    rated,
    avgRating: rated ? Math.round((sum / rated) * 10) / 10 : null,
    distribution,
    sentToGoogle: distribution[4] + distribution[5],
    needsAttention: distribution[1] + distribution[2] + distribution[3],
    openCallbacks: Number(cb?.n ?? 0),
  };
}

export type GiftMetrics = {
  offered: number;
  ordered: number;
  delivered: number;
  failed: number;
  spent: number;
  byProduct: { product: string; n: number; amount: number }[];
};

export async function getGiftMetrics(since: Date, businessId?: string): Promise<GiftMetrics> {
  const where = and(
    gte(giftCards.createdAt, since),
    businessId ? eq(giftCards.businessId, businessId) : undefined,
  );
  const [row] = await db
    .select({
      offered: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'offered')`,
      ordered: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} IN ('created','delivered'))`,
      delivered: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'delivered')`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${giftCards.status} = 'failed')`,
      spent: sql<string>`COALESCE(SUM(${giftCards.amount}) FILTER (WHERE ${giftCards.status} IN ('created','delivered')), 0)`,
    })
    .from(giftCards)
    .where(where);
  const byProduct = await db
    .select({
      product: giftCards.productName,
      n: count(),
      amount: sql<string>`COALESCE(SUM(${giftCards.amount}), 0)`,
    })
    .from(giftCards)
    .where(and(where, or(eq(giftCards.status, "created"), eq(giftCards.status, "delivered"))))
    .groupBy(giftCards.productName)
    .orderBy(desc(count()));
  return {
    offered: Number(row?.offered ?? 0),
    ordered: Number(row?.ordered ?? 0),
    delivered: Number(row?.delivered ?? 0),
    failed: Number(row?.failed ?? 0),
    spent: Number(row?.spent ?? 0),
    byProduct: byProduct.map((p) => ({
      product: p.product ?? "—",
      n: Number(p.n),
      amount: Number(p.amount),
    })),
  };
}

export type ActivityItem = {
  id: string;
  at: Date;
  kind: "request" | "opened" | "rating" | "gift" | "callback";
  title: string;
  detail: string | null;
  href: string | null;
  rating?: number | null;
};

/** Merged, newest-first feed of what customers did. */
export async function listRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const [reqs, rates, gifts, cbs] = await Promise.all([
    db
      .select({
        id: reviewRequests.id,
        createdAt: reviewRequests.createdAt,
        clickedAt: reviewRequests.clickedAt,
        name: contacts.name,
        biz: businesses.name,
      })
      .from(reviewRequests)
      .innerJoin(contacts, eq(reviewRequests.contactId, contacts.id))
      .innerJoin(businesses, eq(reviewRequests.businessId, businesses.id))
      .orderBy(desc(reviewRequests.createdAt))
      .limit(limit),
    db
      .select({
        id: reviews.id,
        at: reviews.createdAt,
        rating: reviews.rating,
        name: contacts.name,
        contactId: reviews.contactId,
      })
      .from(reviews)
      .leftJoin(contacts, eq(reviews.contactId, contacts.id))
      .where(and(eq(reviews.source, "internal"), isNotNull(reviews.rating)))
      .orderBy(desc(reviews.createdAt))
      .limit(limit),
    db
      .select({
        id: giftCards.id,
        at: giftCards.updatedAt,
        status: giftCards.status,
        product: giftCards.productName,
        amount: giftCards.amount,
        name: contacts.name,
        reviewRequestId: giftCards.reviewRequestId,
      })
      .from(giftCards)
      .innerJoin(contacts, eq(giftCards.contactId, contacts.id))
      .where(or(eq(giftCards.status, "created"), eq(giftCards.status, "delivered")))
      .orderBy(desc(giftCards.updatedAt))
      .limit(limit),
    db
      .select({ id: tasks.id, at: tasks.createdAt, title: tasks.title, done: tasks.completedAt })
      .from(tasks)
      .where(like(tasks.title, "Manager callback%"))
      .orderBy(desc(tasks.createdAt))
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];
  for (const r of reqs) {
    items.push({
      id: `req-${r.id}`,
      at: r.createdAt,
      kind: "request",
      title: `Review request sent to ${r.name}`,
      detail: r.biz,
      href: `/admin/reviews/${r.id}`,
    });
    if (r.clickedAt) {
      items.push({
        id: `open-${r.id}`,
        at: r.clickedAt,
        kind: "opened",
        title: `${r.name} opened their review link`,
        detail: null,
        href: `/admin/reviews/${r.id}`,
      });
    }
  }
  for (const r of rates) {
    items.push({
      id: `rate-${r.id}`,
      at: r.at,
      kind: "rating",
      title: `${r.name ?? "Anonymous"} rated ${r.rating}/5`,
      detail: (r.rating ?? 0) >= 4 ? "Sent to Google" : "Feedback questionnaire",
      href: r.contactId ? `/admin/contacts/${r.contactId}` : null,
      rating: r.rating,
    });
  }
  for (const g of gifts) {
    items.push({
      id: `gift-${g.id}`,
      at: g.at,
      kind: "gift",
      title: `${g.name} picked ${g.product ?? "a gift card"}`,
      detail: `$${Number(g.amount).toFixed(0)} · ${g.status === "delivered" ? "delivered" : "ordered"}`,
      href: g.reviewRequestId ? `/admin/reviews/${g.reviewRequestId}` : "/admin/gifts",
    });
  }
  for (const c of cbs) {
    items.push({
      id: `cb-${c.id}`,
      at: c.at,
      kind: "callback",
      title: c.title,
      detail: c.done ? "Done" : "Open — call within 1 business day",
      href: "/admin/reviews?status=submitted",
    });
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export async function getBusinessBreakdown(since: Date) {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      requests: sql<number>`COUNT(DISTINCT ${reviewRequests.id})`,
      opened: sql<number>`COUNT(DISTINCT ${reviewRequests.id}) FILTER (WHERE ${reviewRequests.clickedAt} IS NOT NULL)`,
      gifts: sql<number>`COUNT(DISTINCT ${giftCards.id}) FILTER (WHERE ${giftCards.status} IN ('created','delivered'))`,
      spent: sql<string>`COALESCE(SUM(DISTINCT CASE WHEN ${giftCards.status} IN ('created','delivered') THEN ${giftCards.amount} END), 0)`,
    })
    .from(businesses)
    .leftJoin(
      reviewRequests,
      and(eq(reviewRequests.businessId, businesses.id), gte(reviewRequests.createdAt, since)),
    )
    .leftJoin(giftCards, and(eq(giftCards.reviewRequestId, reviewRequests.id)))
    .where(eq(businesses.isActive, true))
    .groupBy(businesses.id, businesses.name)
    .orderBy(businesses.sortOrder);
  return rows.map((r) => ({
    ...r,
    requests: Number(r.requests),
    opened: Number(r.opened),
    gifts: Number(r.gifts),
    spent: Number(r.spent),
  }));
}
