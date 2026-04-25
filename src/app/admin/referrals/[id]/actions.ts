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

  const now = new Date();
  const status = parsed.data.status as ReferralStatus;
  const updates: Record<string, Date | string> = { status };
  if (status === "contacted") updates.contactedAt = now;
  else if (status === "hired") updates.hiredAt = now;
  else if (status === "completed") updates.convertedAt = now;
  else if (status === "rejected") updates.rejectedAt = now;

  const [updated] = await db
    .update(referrals)
    .set(updates)
    .where(eq(referrals.id, parsed.data.referralId))
    .returning();

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
