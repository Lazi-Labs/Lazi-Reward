import { NextResponse } from "next/server";

import { applyWebhookEvent } from "@/lib/gifts";
import { verifyWebhookSignature, type TremendousWebhookEvent } from "@/lib/tremendous";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tremendous → us. Signed with HMAC-SHA256 over the raw body
 * (`Tremendous-Webhook-Signature: sha256=<hex>`). Tremendous retries up to 17×
 * until it sees a 200, so we always 200 once the signature checks out.
 */
export async function POST(req: Request) {
  const secret = process.env.TREMENDOUS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }
  const raw = await req.text();
  const sig = req.headers.get("tremendous-webhook-signature");
  if (!verifyWebhookSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let evt: TremendousWebhookEvent;
  try {
    evt = JSON.parse(raw) as TremendousWebhookEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!evt?.event) return NextResponse.json({ error: "no_event" }, { status: 400 });

  try {
    const result = await applyWebhookEvent(evt);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("tremendous webhook failed", evt.event, err);
    // 500 so Tremendous retries — the DB hiccup is transient.
    return NextResponse.json({ error: "apply_failed" }, { status: 500 });
  }
}
