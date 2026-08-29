"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, commChannels } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { brandFor } from "@/lib/brand";
import { issueGiftForReviewRequest, markGiftSent, retryGift } from "@/lib/gifts";
import { buildReviewRequestEmail, buildReviewRequestMessage } from "@/lib/messages";
import { isEmailConfigured, isSmsConfigured, sendEmail, sendSms } from "@/lib/notify";
import {
  createReviewRequest,
  markReviewRequestSent,
  reviewLinkFor,
} from "@/lib/reviews";

const schema = z
  .object({
    businessId: z.string().uuid("Pick a business"),
    name: z.string().min(2, "Enter the customer's name").max(120),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z.string().min(7, "Enter a valid phone").max(30).optional().or(z.literal("")),
    channel: z.enum(commChannels),
  })
  .refine((d) => d.email || d.phone, {
    message: "Add at least an email or a phone number",
    path: ["phone"],
  });

export type CreateReviewRequestResult =
  | {
      ok: true;
      name: string;
      link: string;
      message: string;
      gift: { status: string; link: string | null; amount: number; reason: string | null } | null;
      sent: { channel: "sms" | "email"; ok: boolean; error?: string } | null;
    }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; error: string };

export async function createReviewRequestAction(
  _prev: CreateReviewRequestResult | null,
  formData: FormData,
): Promise<CreateReviewRequestResult> {
  await requireAdmin();

  const parsed = schema.safeParse({
    businessId: formData.get("businessId") ?? "",
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    channel: formData.get("channel") ?? "sms",
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const biz = await db.query.businesses.findFirst({
      where: eq(businesses.id, parsed.data.businessId),
    });
    if (!biz) return { ok: false, error: "Business not found" };

    const req = await createReviewRequest({
      businessId: biz.id,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      channel: parsed.data.channel,
    });

    // The thank-you gift is unconditional — mint it with the request.
    const gift = await issueGiftForReviewRequest(req.id);
    const giftLink = gift?.status === "created" || gift?.status === "delivered" ? gift.redemptionLink : null;

    const link = await reviewLinkFor(biz.slug, req.token);
    const brand = brandFor(biz.slug);
    const msgArgs = {
      brand,
      firstName: parsed.data.name.split(" ")[0] ?? null,
      reviewLink: link,
      giftLink,
      giftAmount: gift ? Number(gift.amount) : null,
    };
    const message = buildReviewRequestMessage(msgArgs);

    // Auto-send when the channel's provider is configured; otherwise staff
    // use the prefilled "Text it" button and mark it sent.
    let sent: { channel: "sms" | "email"; ok: boolean; error?: string } | null = null;
    if (parsed.data.channel === "sms" && parsed.data.phone && isSmsConfigured()) {
      const r = await sendSms(parsed.data.phone, message);
      sent = { channel: "sms", ok: r.ok, error: r.ok ? undefined : r.error };
      if (r.ok) {
        await markReviewRequestSent(req.id);
        if (gift) await markGiftSent(gift.id, "sms");
      }
    } else if (parsed.data.channel === "email" && parsed.data.email && isEmailConfigured()) {
      const em = buildReviewRequestEmail(msgArgs);
      const r = await sendEmail({ to: parsed.data.email, ...em });
      sent = { channel: "email", ok: r.ok, error: r.ok ? undefined : r.error };
      if (r.ok) {
        await markReviewRequestSent(req.id);
        if (gift) await markGiftSent(gift.id, "email");
      }
    }

    revalidatePath("/admin/reviews");
    revalidatePath("/admin");
    return {
      ok: true,
      name: parsed.data.name,
      link,
      message,
      gift: gift
        ? { status: gift.status, link: giftLink, amount: Number(gift.amount), reason: gift.failureReason }
        : null,
      sent,
    };
  } catch (err) {
    console.error("createReviewRequestAction failed", err);
    return { ok: false, error: "Could not create the review link. Try again." };
  }
}

export async function markSentAction(id: string, giftId?: string | null) {
  await requireAdmin();
  await markReviewRequestSent(id);
  if (giftId) await markGiftSent(giftId, "manual");
  revalidatePath("/admin/reviews");
}

export async function retryGiftAction(giftId: string) {
  await requireAdmin();
  const row = await retryGift(giftId);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { ok: row?.status === "created", reason: row?.failureReason ?? null };
}
