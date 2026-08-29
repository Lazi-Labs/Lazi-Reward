"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PAYOUT_IDS } from "@/lib/brand";
import {
  claimReward,
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
  paymentMethod: z.enum(PAYOUT_IDS),
  paymentDetails: z.string().max(200).optional(),
});

export type ClaimRewardResult = { ok: true } | { ok: false; error: string };

export async function claimRewardAction(
  input: z.infer<typeof claimSchema>,
): Promise<ClaimRewardResult> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a payout option." };
  try {
    const user = await ensureCurrentUser();
    const { referrer } = await getOrCreateReferrerForUser(user.id);
    const updated = await claimReward({
      rewardId: parsed.data.rewardId,
      referrerId: referrer.id,
      paymentMethod: parsed.data.paymentMethod,
      paymentDetails: parsed.data.paymentDetails?.trim() || undefined,
    });
    if (!updated) return { ok: false, error: "That reward is no longer claimable." };
  } catch (err) {
    console.error("claimRewardAction failed", err);
    return { ok: false, error: "Could not save your choice. Try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
