"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { retryGiftAction } from "./actions";
import { CopyButton } from "./copy-button";

type Props = {
  gift: {
    id: string;
    status: string;
    amount: string;
    redemptionLink: string | null;
    failureReason: string | null;
  } | null;
};

const TONE: Record<string, "default" | "secondary" | "destructive"> = {
  created: "secondary",
  delivered: "default",
  failed: "destructive",
  canceled: "destructive",
};

export function GiftCell({ gift }: Props) {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState<string | null>(null);

  if (!gift) return <span className="text-xs text-muted-foreground">—</span>;

  const label =
    gift.status === "created"
      ? "Ready"
      : gift.status === "delivered"
        ? "Delivered"
        : gift.status === "failed"
          ? "Failed"
          : "Canceled";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Badge variant={TONE[gift.status] ?? "secondary"} title={gift.failureReason ?? undefined}>
        ${Number(gift.amount).toFixed(0)} · {label}
      </Badge>
      {gift.redemptionLink ? <CopyButton value={gift.redemptionLink} label="Gift" /> : null}
      {gift.status === "failed" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await retryGiftAction(gift.id);
              setReason(r.ok ? null : (r.reason ?? "failed"));
            })
          }
        >
          <RefreshCw className="size-4" /> Retry
        </Button>
      ) : null}
      {reason ? <span className="w-full text-right text-[11px] text-pce-red-deep">{reason}</span> : null}
    </div>
  );
}
