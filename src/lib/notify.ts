/**
 * Outbound SMS (Twilio) and email (Resend) via plain fetch — no SDKs.
 * Both report `not_configured` when their env vars are blank so callers can
 * fall back to a manual "Text it" flow.
 */

export type NotifyResult = { ok: true; id: string } | { ok: false; error: string };

export function isSmsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER,
  );
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/** Normalize a US number to E.164; returns null if it can't. */
export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.trim().startsWith("+") && digits.length > 10) return `+${digits}`;
  return null;
}

export async function sendSms(to: string, body: string): Promise<NotifyResult> {
  if (!isSmsConfigured()) return { ok: false, error: "not_configured" };
  const e164 = toE164(to);
  if (!e164) return { ok: false, error: "invalid_phone" };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ To: e164, From: process.env.TWILIO_FROM_NUMBER!, Body: body });
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const json = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: json.message ?? `twilio_${res.status}` };
    return { ok: true, id: json.sid ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "twilio_error" };
  }
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<NotifyResult> {
  if (!isEmailConfigured()) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [args.to],
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: json.message ?? `resend_${res.status}` };
    return { ok: true, id: json.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "resend_error" };
  }
}
