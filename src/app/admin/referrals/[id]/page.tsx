import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { referralStatuses } from "@/db/schema";
import { getReferralDetail } from "@/lib/admin";
import { REFERRAL_STATUSES_FOR_DISPLAY } from "@/lib/referrals";

import { setReferralStatusAction } from "./actions";

const fmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ADVANCE_OPTIONS = [
  "contacted",
  "hired",
  "completed",
  "rejected",
] as const;

export default async function AdminReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getReferralDetail(id);
  if (!detail) notFound();

  const { referrer, campaign, referredContact } = detail;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Referral
          </p>
          <h1 className="text-2xl font-bold">{referredContact.name}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {fmt.format(detail.createdAt)} via{" "}
            {campaign?.name ?? "—"}
          </p>
        </div>
        <Badge>{REFERRAL_STATUSES_FOR_DISPLAY[detail.status]}</Badge>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referred person</CardTitle>
            <CardDescription>The contact this referral is for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row label="Name" value={referredContact.name} />
            <Row label="Email" value={referredContact.email ?? "—"} />
            <Row label="Phone" value={referredContact.phone ?? "—"} />
            <Row label="Source" value={referredContact.source} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referrer</CardTitle>
            <CardDescription>Who sent this referral in.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row
              label="Name"
              value={referrer?.user?.name ?? referrer?.user?.email ?? "—"}
            />
            <Row label="Email" value={referrer?.user?.email ?? "—"} />
            <Row label="Phone" value={referrer?.user?.phone ?? "—"} />
            <Row
              label="Note from referrer"
              value={detail.referrerNote ?? "—"}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Advance status</CardTitle>
          <CardDescription>
            Each transition writes an activity-log entry on the contact.
            &ldquo;Completed&rdquo; will trigger reward issuance in Phase 5.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ADVANCE_OPTIONS.map((status) => (
            <form
              key={status}
              action={async (fd) => {
                "use server";
                fd.set("referralId", id);
                fd.set("status", status);
                await setReferralStatusAction(fd);
              }}
            >
              <Button
                type="submit"
                variant={status === "rejected" ? "destructive" : "outline"}
                disabled={detail.status === status}
              >
                Mark {REFERRAL_STATUSES_FOR_DISPLAY[status]}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <details className="rounded-md border p-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium">
          Debug — all referral fields
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs">
          {JSON.stringify(
            {
              id: detail.id,
              status: detail.status,
              clickedAt: detail.clickedAt,
              signedUpAt: detail.signedUpAt,
              contactedAt: detail.contactedAt,
              hiredAt: detail.hiredAt,
              convertedAt: detail.convertedAt,
              rewardedAt: detail.rewardedAt,
            },
            null,
            2,
          )}
        </pre>
      </details>

      {/* Suppress unused import warning for the full enum list */}
      <input type="hidden" name="_statuses" value={referralStatuses.join(",")} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
