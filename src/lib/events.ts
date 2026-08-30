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
    | "gift.claimed"
    | "referral.attributed"
    | "referral.status"
    | "referral.completed"
    | "booking.created";
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
  const headers = {
    "Content-Type": "application/json",
    ...(sig ? { "X-Rewards-Signature": sig } : {}),
  };
  // Deliberately not awaited by callers; the Worker endpoint is idempotent on
  // (requestId, type), so blind retries are safe. Retries network errors and
  // 429/5xx with backoff; logs every outcome.
  void (async () => {
    const delays = [0, 2_000, 10_000];
    for (let attempt = 0; attempt < delays.length; attempt += 1) {
      if (delays[attempt]) await new Promise((r) => setTimeout(r, delays[attempt]));
      try {
        const res = await fetch(url, { method: "POST", headers, body });
        if (res.ok) {
          console.log(`emitEvent ${evt.type} → ${res.status}${attempt ? ` (attempt ${attempt + 1})` : ""}`);
          return;
        }
        const retryable = res.status === 429 || res.status >= 500;
        const text = (await res.text().catch(() => "")).slice(0, 300);
        console.error(`emitEvent ${evt.type} → ${res.status}${retryable ? ", will retry" : ""}: ${text}`);
        if (!retryable) return; // 4xx other than 429: our bug, retrying won't help
      } catch (err) {
        console.error(`emitEvent ${evt.type} network error (attempt ${attempt + 1})`, err);
      }
    }
    console.error(`emitEvent ${evt.type} gave up after ${delays.length} attempts`);
  })();
}
