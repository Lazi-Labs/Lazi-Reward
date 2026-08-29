import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getContactDetail } from "@/lib/admin";
import { REFERRAL_STATUSES_FOR_DISPLAY } from "@/lib/referrals";

import { addContactNoteAction, sendThankYouGiftAction } from "./actions";

const fmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getContactDetail(id);
  if (!detail) notFound();

  const { contact, referrals: contactReferrals, comms } = detail;

  return (
    <>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Contact
        </p>
        <h1 className="text-2xl font-bold">{contact.name}</h1>
        <p className="text-sm text-muted-foreground">
          {contact.business?.name} · added {fmt.format(contact.createdAt)}
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Row label="Email" value={contact.email ?? "—"} />
            <Row label="Phone" value={contact.phone ?? "—"} />
            <Row label="Source" value={contact.source} />
            <Row
              label="Owner"
              value={contact.owner?.name ?? contact.owner?.email ?? "Unassigned"}
            />
            <Row
              label="Linked user"
              value={
                contact.linkedUser?.name ?? contact.linkedUser?.email ?? "—"
              }
            />
            {contact.notes ? (
              <div>
                <p className="text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{contact.notes}</p>
              </div>
            ) : null}
            <form action={sendThankYouGiftAction} className="mt-2">
              <input type="hidden" name="contactId" value={contact.id} />
              <Button type="submit" size="sm" variant="outline">
                Send ${Number(contact.business?.giftAmount ?? 10).toFixed(0)} thank-you gift
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Referral history</CardTitle>
            <CardDescription>
              Every referral this person has been part of, oldest at the
              bottom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contactReferrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No referrals tied to this contact yet.
              </p>
            ) : (
              <ul className="divide-y">
                {contactReferrals.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div>
                      <Link
                        href={`/admin/referrals/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.campaign?.name ?? "Referral"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        from{" "}
                        {r.referrer?.user?.name ??
                          r.referrer?.user?.email ??
                          "—"}
                        {" · "}
                        {fmt.format(r.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {REFERRAL_STATUSES_FOR_DISPLAY[r.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Calls, texts, emails, notes, and system events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet — log a note on the right.
              </p>
            ) : (
              <ul className="space-y-4">
                {comms.map((c) => (
                  <li key={c.id} className="space-y-1 border-l-2 pl-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {c.channel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmt.format(c.occurredAt)}
                      </span>
                    </div>
                    {c.subject ? (
                      <p className="text-sm">{c.subject}</p>
                    ) : null}
                    {c.body ? (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {c.body}
                      </p>
                    ) : null}
                    {c.user ? (
                      <p className="text-xs text-muted-foreground">
                        — {c.user.name ?? c.user.email}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log a note</CardTitle>
            <CardDescription>
              Anything you want the team to see next time they look up this
              contact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (fd) => {
                "use server";
                fd.set("contactId", id);
                await addContactNoteAction(fd);
              }}
              className="space-y-3"
            >
              <div className="grid gap-2">
                <Label htmlFor="body">Note</Label>
                <Textarea id="body" name="body" rows={5} required />
              </div>
              <Button type="submit">Save note</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
