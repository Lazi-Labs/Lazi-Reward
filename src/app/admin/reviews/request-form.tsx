"use client";

import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createReviewRequestAction, type CreateReviewRequestResult } from "./actions";
import { CopyButton } from "./copy-button";

type Biz = { id: string; name: string };

function fieldError(state: CreateReviewRequestResult | null, field: string) {
  if (!state || state.ok) return undefined;
  if ("fieldErrors" in state) return state.fieldErrors[field]?.[0];
  return undefined;
}

export function ReviewRequestForm({ businesses }: { businesses: Biz[] }) {
  const [state, action, pending] = useActionState<CreateReviewRequestResult | null, FormData>(
    createReviewRequestAction,
    null,
  );

  if (state?.ok) {
    const sms = `sms:?&body=${encodeURIComponent(state.message)}`;
    const giftOk = state.gift && (state.gift.status === "offered" || state.gift.link);
    return (
      <div className="space-y-3 rounded-xl border border-pce-teal/40 bg-pce-sky/40 p-4 text-sm">
        <p className="font-semibold text-pce-navy">Ready for {state.name}</p>

        {state.sent ? (
          state.sent.ok ? (
            <Badge>Sent by {state.sent.channel === "sms" ? "text" : "email"}</Badge>
          ) : (
            <p className="text-xs text-pce-red-deep">
              Auto-send failed ({state.sent.error}) — send it manually below.
            </p>
          )
        ) : null}

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gift card
          </p>
          {giftOk ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">${state.gift!.amount} offered</Badge>
              <span className="text-xs text-muted-foreground">
                Customer picks their card on the review page; the order is placed then.
              </span>
            </div>
          ) : state.gift ? (
            <p className="text-xs text-pce-red-deep">
              Gift not issued ({state.gift.reason ?? state.gift.status}) — retry from the table
              below once Tremendous is configured.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Gifts are disabled for this business.</p>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Message
          </p>
          <pre className="whitespace-pre-wrap rounded-md bg-white px-3 py-2 font-sans text-xs">
            {state.message}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2">
          <CopyButton value={state.message} label="Copy message" variant="default" />
          <a
            href={sms}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            Text it
          </a>
          <CopyButton value={state.link} label="Copy review link" />
          <Button type="button" size="sm" variant="ghost" onClick={() => window.location.reload()}>
            New request
          </Button>
        </div>
      </div>
    );
  }

  const generalError = state && !state.ok && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="businessId">Business</Label>
        <select
          id="businessId"
          name="businessId"
          required
          defaultValue={businesses[0]?.id}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {fieldError(state, "businessId") && (
          <p className="text-xs text-destructive">{fieldError(state, "businessId")}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rr-name">Customer name</Label>
        <Input id="rr-name" name="name" required placeholder="Jane Doe" />
        {fieldError(state, "name") && (
          <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="rr-phone">Phone</Label>
          <Input id="rr-phone" name="phone" type="tel" placeholder="727-555-0100" />
          {fieldError(state, "phone") && (
            <p className="text-xs text-destructive">{fieldError(state, "phone")}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rr-email">Email</Label>
          <Input id="rr-email" name="email" type="email" placeholder="jane@example.com" />
          {fieldError(state, "email") && (
            <p className="text-xs text-destructive">{fieldError(state, "email")}</p>
          )}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rr-channel">Send via</Label>
        <select
          id="rr-channel"
          name="channel"
          defaultValue="sms"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="sms">Text message</option>
          <option value="email">Email</option>
          <option value="call">Read out on a call</option>
        </select>
      </div>
      {generalError && <p className="text-sm text-destructive">{generalError}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create request + gift"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Mints the thank-you gift card and the review link together. The gift is never conditioned
        on the review.
      </p>
    </form>
  );
}
