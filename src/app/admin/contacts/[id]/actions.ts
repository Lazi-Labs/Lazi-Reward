"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { communicationLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { issueManualGift } from "@/lib/gifts";

const noteSchema = z.object({
  contactId: z.string().uuid(),
  body: z.string().min(1, "Add a note").max(2000),
});

export async function addContactNoteAction(formData: FormData) {
  const me = await requireAdmin();
  const parsed = noteSchema.safeParse({
    contactId: formData.get("contactId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Note can't be empty" } as const;
  }

  await db.insert(communicationLogs).values({
    contactId: parsed.data.contactId,
    userId: me.id,
    channel: "note",
    direction: "outbound",
    subject: null,
    body: parsed.data.body,
  });

  revalidatePath(`/admin/contacts/${parsed.data.contactId}`);
  return { ok: true } as const;
}

export async function sendThankYouGiftAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const contactId = String(formData.get("contactId") ?? "");
  if (!contactId) return;
  await issueManualGift({ contactId });
  revalidatePath(`/admin/contacts/${contactId}`);
  revalidatePath("/admin");
}
