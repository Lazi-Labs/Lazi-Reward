"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  submitReferralAction,
  type SubmitReferralResult,
} from "./actions";

function fieldError(
  state: SubmitReferralResult | null,
  field: string,
): string | undefined {
  if (!state || state.ok) return undefined;
  if ("fieldErrors" in state) return state.fieldErrors[field]?.[0];
  return undefined;
}

export function ReferralForm() {
  const [state, action, pending] = useActionState<
    SubmitReferralResult | null,
    FormData
  >(submitReferralAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-md border border-green-500/20 bg-green-500/5 p-4 text-sm">
        <p className="font-medium text-green-700 dark:text-green-400">
          Thanks — we&rsquo;ve got it.
        </p>
        <p className="mt-1 text-muted-foreground">
          We&rsquo;ll reach out to your referral and keep you posted in your
          dashboard.
        </p>
      </div>
    );
  }

  const generalError = state && !state.ok && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Friend&rsquo;s name</Label>
        <Input id="name" name="name" required placeholder="Jane Doe" />
        {fieldError(state, "name") && (
          <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
          />
          {fieldError(state, "email") && (
            <p className="text-xs text-destructive">
              {fieldError(state, "email")}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
          />
          {fieldError(state, "phone") && (
            <p className="text-xs text-destructive">
              {fieldError(state, "phone")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          placeholder="Any context you want us to mention when we reach out…"
        />
      </div>

      {generalError && (
        <p className="text-sm text-destructive">{generalError}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit referral"}
      </Button>
    </form>
  );
}
