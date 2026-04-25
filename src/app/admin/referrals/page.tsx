import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAllReferrals } from "@/lib/admin";
import { REFERRAL_STATUSES_FOR_DISPLAY } from "@/lib/referrals";

const TONE: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  clicked: "secondary",
  signed_up: "secondary",
  contacted: "default",
  hired: "default",
  completed: "default",
  rejected: "destructive",
  cancelled: "destructive",
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default async function AdminReferralsPage() {
  const rows = await listAllReferrals();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-sm text-muted-foreground">
          Every referral submitted across all campaigns. Click any row to
          advance status or contact the referred person.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
          No referrals yet.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred person</TableHead>
                <TableHead className="hidden md:table-cell">From</TableHead>
                <TableHead className="hidden lg:table-cell">Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/referrals/${r.id}`}
                      className="hover:underline"
                    >
                      {r.referredName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.referredEmail ?? r.referredPhone ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>{r.referrerName ?? r.referrerEmail}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.referrerEmail}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {r.campaignName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TONE[r.status] ?? "secondary"}>
                      {REFERRAL_STATUSES_FOR_DISPLAY[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {fmt(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
