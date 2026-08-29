"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  claimRewardAsGift,
  createManualReferral,
  getOrCreateReferrerForUser,
} from "@/lib/referrals";
import { ensureCurrentUser } from "@/lib/users";

const submitReferralSchema = z
  .object({
    name: z.string().min(2, "Enter a name").max(100),
    email: z
      .string()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .min(7, "Enter a valid phone number")
      .max(30)
      .optional()
      .or(z.literal("")),
    note: z.string().max(500).optional().or(z.literal("")),
  })
  .refine((d) => d.email || d.phone, {
    message: "Add at least an email or a phone number",
    path: ["email"],
  });

export type SubmitReferralResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; error: string };

export async function submitReferralAction(
  _prev: SubmitReferralResult | null,
  formData: FormData,
): Promise<SubmitReferralResult> {
  const parsed = submitReferralSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const user = await ensureCurrentUser();
    await createManualReferral({
      referrerLocalUserId: user.id,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      note: parsed.data.note || undefined,
    });
  } catch (err) {
    console.error("submitReferralAction failed", err);
    return { ok: false, error: "Could not save your referral. Try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Reward claim ─────────────────────────────────────────────────────────────

const claimSchema = z.object({
  rewardId: z.string().uuid(),
  productId: z.string().min(1).max(64),
});

export type ClaimRewardResult =
  | { ok: true; link: string; productName: string }
  | { ok: false; error: string };

export async function claimRewardAction(
  input: z.infer<typeof claimSchema>,
): Promise<ClaimRewardResult> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a gift card." };
  try {
    const user = await ensureCurrentUser();
    const got = await getOrCreateReferrerForUser(user.id);
    if (!got) return { ok: false, error: "The referral program is paused." };
    const gift = await claimRewardAsGift({
      rewardId: parsed.data.rewardId,
      referrerId: got.referrer.id,
      productId: parsed.data.productId,
    });
    if (gift && (gift.status === "created" || gift.status === "delivered") && gift.redemptionLink) {
      revalidatePath("/dashboard");
      return { ok: true, link: gift.redemptionLink, productName: gift.productName ?? "gift card" };
    }
    return { ok: false, error: "We couldn't issue your gift just now. Please call us and we'll sort it out." };
  } catch (err) {
    console.error("claimRewardAction failed", err);
    return { ok: false, error: "Could not save your choice. Try again." };
  }
}
