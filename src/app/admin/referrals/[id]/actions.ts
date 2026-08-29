"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  communicationLogs,
  referrals,
  referralStatuses,
  type ReferralStatus,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { completeReferral, setReferralStatus } from "@/lib/referrals";

const setStatusSchema = z.object({
  referralId: z.string().uuid(),
  status: z.enum(referralStatuses),
});

export async function setReferralStatusAction(formData: FormData) {
  const me = await requireAdmin();
  const parsed = setStatusSchema.safeParse({
    referralId: formData.get("referralId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" } as const;
  }

  const status = parsed.data.status as ReferralStatus;
  let updated: typeof referrals.$inferSelect | null | undefined;
  if (status === "completed") {
    const res = await completeReferral({ referralId: parsed.data.referralId, source: "admin" });
    if (!res.ok) return { ok: false, error: "Referral not found" } as const;
    updated = await db.query.referrals.findFirst({ where: eq(referrals.id, parsed.data.referralId) });
  } else {
    updated = await setReferralStatus(parsed.data.referralId, status);
  }

  if (updated) {
    await db.insert(communicationLogs).values({
      contactId: updated.referredContactId,
      userId: me.id,
      channel: "system",
      direction: "outbound",
      subject: `Referral status set to ${status}`,
      body: null,
      externalRef: `referral:${updated.id}`,
    });
  }

  revalidatePath(`/admin/referrals/${parsed.data.referralId}`);
  revalidatePath("/admin/referrals");
  return { ok: true } as const;
}
