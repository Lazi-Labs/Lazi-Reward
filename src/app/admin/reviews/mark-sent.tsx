"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { markSentAction } from "./actions";

export function MarkSentButton({ requestId, giftId }: { requestId: string; giftId: string | null }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => start(() => markSentAction(requestId, giftId))}
    >
      Mark sent
    </Button>
  );
}
