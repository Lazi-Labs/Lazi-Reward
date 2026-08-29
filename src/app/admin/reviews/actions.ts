"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, commChannels } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
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
  | { ok: true; link: string; token: string; name: string }
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
    const link = await reviewLinkFor(biz.slug, req.token);
    revalidatePath("/admin/reviews");
    return { ok: true, link, token: req.token, name: parsed.data.name };
  } catch (err) {
    console.error("createReviewRequestAction failed", err);
    return { ok: false, error: "Could not create the review link. Try again." };
  }
}

export async function markSentAction(id: string) {
  await requireAdmin();
  await markReviewRequestSent(id);
  revalidatePath("/admin/reviews");
}
