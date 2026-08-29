import { createHmac } from "node:crypto";

/**
 * Outbound events to upstream automations (e.g. the ST→GHL sync Worker).
 * Fire-and-forget; never blocks the customer flow. Signed with
 * `X-Rewards-Signature: sha256=<hmac of raw body>` using OUTBOUND_EVENTS_SECRET.
 *
 * Event types:
 *   review_request.opened   { requestId, token, contactId, externalRefs, metadata }
 *   rating.submitted        { …, rating, sentToGoogle }
 *   feedback.submitted      { …, rating, wantsCall }
 *   gift.claimed            { …, giftId, product, amount, redemptionLink }
 */
export type RewardsEvent = {
  type:
    | "review_request.opened"
    | "rating.submitted"
    | "feedback.submitted"
    | "gift.claimed";
  at: string;
  business: string;
  requestId: string | null;
  token: string | null;
  contactId: string | null;
  externalRefs: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  data: Record<string, unknown>;
};

export function emitEvent(evt: Omit<RewardsEvent, "at">) {
  const url = process.env.OUTBOUND_EVENTS_URL?.trim();
  if (!url) return;
  const body = JSON.stringify({ ...evt, at: new Date().toISOString() });
  const secret = process.env.OUTBOUND_EVENTS_SECRET?.trim() ?? "";
  const sig = secret ? `sha256=${createHmac("sha256", secret).update(body).digest("hex")}` : "";
  // Deliberately not awaited by callers; errors are logged only.
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sig ? { "X-Rewards-Signature": sig } : {}),
    },
    body,
  }).catch((err) => console.error("emitEvent failed", evt.type, err));
}
