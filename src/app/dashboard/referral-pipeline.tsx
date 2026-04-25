import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REFERRAL_STATUSES_FOR_DISPLAY,
  type ReferralRowForList,
} from "@/lib/referrals";

const STATUS_TONE: Record<string, string> = {
  pending: "secondary",
  clicked: "secondary",
  signed_up: "secondary",
  contacted: "default",
  hired: "default",
  completed: "default",
  rejected: "destructive",
  cancelled: "destructive",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function ReferralPipeline({ rows }: { rows: ReferralRowForList[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No referrals yet — submit one above or share your link.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.referredName}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {row.referredEmail ?? row.referredPhone ?? "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  (STATUS_TONE[row.status] as
                    | "default"
                    | "secondary"
                    | "destructive") ?? "secondary"
                }
              >
                {REFERRAL_STATUSES_FOR_DISPLAY[row.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatDate(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
