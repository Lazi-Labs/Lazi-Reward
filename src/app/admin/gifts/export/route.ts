import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { parsePeriod, periodStart } from "@/lib/admin-metrics";
import { listGiftCards } from "@/lib/gifts";

export const dynamic = "force-dynamic";

function csv(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const since = periodStart(parsePeriod(sp.get("days") ?? undefined));
  const rows = await listGiftCards({
    since,
    status: sp.get("status") ?? undefined,
    businessId: sp.get("business") ?? undefined,
    q: sp.get("q") ?? undefined,
    limit: 5000,
  });
  const header = [
    "created_at",
    "business",
    "customer",
    "status",
    "amount",
    "card",
    "sent_via",
    "sent_at",
    "delivered_at",
    "tremendous_order_id",
    "failure_reason",
  ];
  const lines = [header.join(",")];
  for (const g of rows) {
    lines.push(
      [
        g.createdAt.toISOString(),
        g.businessName,
        g.contactName,
        g.status,
        g.amount,
        g.productName ?? "",
        g.deliveryChannel ?? "",
        g.sentAt?.toISOString() ?? "",
        g.deliveredAt?.toISOString() ?? "",
        g.tremendousOrderId ?? "",
        g.failureReason ?? "",
      ]
        .map(csv)
        .join(","),
    );
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gift-cards-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
