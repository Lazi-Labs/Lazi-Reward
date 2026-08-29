"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { communicationLogs, contacts, referrals, referrers, users } from "@/db/schema";
import { brandFor } from "@/lib/brand";
import { attributeReferral, emitReferralEvent, friendOfferFor, getActiveCampaign } from "@/lib/referrals";
import {
  ServiceTitanError,
  ST_IDS,
  createCustomerWithLocation,
  createLead,
  findCustomerByPhone,
  getCustomerLocations,
  isServiceTitanConfigured,
  markCustomerReferred,
  serviceOption,
} from "@/lib/servicetitan";
import { REFERRAL_COOKIE_NAME } from "@/lib/users";
import { getBusinessBySlug } from "@/lib/reviews";

const schema = z.object({
  service: z.string().min(1),
  name: z.string().min(2).max(120),
  phone: z.string().min(10).max(30),
  email: z.string().email().optional().or(z.literal("")),
  street: z.string().min(3).max(160),
  unit: z.string().max(40).optional().or(z.literal("")),
  city: z.string().min(2).max(80),
  state: z.string().length(2).default("FL"),
  zip: z.string().min(5).max(10),
  preferredDay: z.string().max(40).optional().or(z.literal("")),
  preferredWindow: z.enum(["morning", "afternoon", "asap", ""]).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  gateCode: z.string().max(40).optional().or(z.literal("")),
  dog: z.boolean().optional(),
  ref: z.string().max(12).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof schema>;
export type BookingResult =
  | { ok: true; referred: boolean; stBooked: boolean; contactId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Details the wizard shows when a referral code is present. */
export async function referralPreview(code: string) {
  const r = await db.query.referrers.findFirst({
    where: eq(referrers.referralCode, code.trim().toUpperCase()),
    with: { user: true, campaign: true },
  });
  if (!r || !r.campaign.isActive) return null;
  return {
    code: r.referralCode,
    referrerFirst: r.user.name?.split(" ")[0] ?? "A friend",
    friendOffer: friendOfferFor(r.campaign),
  };
}

export async function submitBookingAction(input: BookingInput): Promise<BookingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;
  const svc = serviceOption(d.service);
  if (!svc) return { ok: false, error: "Pick a service." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = h.get("user-agent") ?? null;

  // Simple abuse guard: max 5 bookings per phone per day.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent] = await db
    .select({ n: count() })
    .from(communicationLogs)
    .where(and(eq(communicationLogs.channel, "system"), eq(communicationLogs.subject, `booking:${d.phone}`), gte(communicationLogs.createdAt, dayAgo)));
  if (Number(recent?.n ?? 0) >= 5) return { ok: false, error: "Too many requests — please call us at " + brandFor(null).phone };

  const campaign = await getActiveCampaign();
  const business = campaign?.businessId
    ? await db.query.contacts.findFirst({ where: sql`false` }).then(() => null) // placeholder, resolved below
    : null;
  void business;
  const biz = await getBusinessBySlug("perfect-catch-electric");
  if (!biz) return { ok: false, error: "Booking is temporarily unavailable." };

  // Referral: from the form, else the cookie.
  const cookieStore = await cookies();
  const code = (d.ref || cookieStore.get(REFERRAL_COOKIE_NAME)?.value || "").trim().toUpperCase() || null;
  const email = d.email?.trim().toLowerCase() || null;

  // Contact (upsert by phone/email) + referral row.
  let contactId: string | null = null;
  let referralId: string | null = null;
  let referredBy: string | null = null;
  if (code) {
    const res = await attributeReferral({
      code,
      contact: { name: d.name.trim(), phone: d.phone.trim(), email },
      source: "booking",
      status: "contacted",
      ip,
      userAgent: ua,
      metadata: { service: svc.id, preferred_day: d.preferredDay || null, preferred_window: d.preferredWindow || null },
    });
    if (res.ok) {
      contactId = res.contactId;
      referralId = res.referral.id;
      const ru = await db.query.users.findFirst({ where: eq(users.id, res.referrerUserId) });
      referredBy = ru?.name ?? null;
    }
    // self-referral / unknown code: fall through as a normal booking
  }
  if (!contactId) {
    const existing =
      (email ? await db.query.contacts.findFirst({ where: and(eq(contacts.businessId, biz.id), eq(contacts.email, email)) }) : null) ??
      (await db.query.contacts.findFirst({ where: and(eq(contacts.businessId, biz.id), eq(contacts.phone, d.phone.trim())) }));
    if (existing) contactId = existing.id;
    else {
      const [c] = await db
        .insert(contacts)
        .values({ businessId: biz.id, name: d.name.trim(), phone: d.phone.trim(), email, source: "manual", notes: "Booked online" })
        .returning();
      contactId = c.id;
    }
  }

  // Log the booking (also feeds the rate limit).
  await db.insert(communicationLogs).values({
    contactId,
    channel: "system",
    direction: "inbound",
    subject: `booking:${d.phone}`,
    body: `${svc.label} · ${d.preferredDay || "any day"} ${d.preferredWindow || ""} · ${d.street}, ${d.city} ${d.zip}${d.notes ? ` · ${d.notes}` : ""}`,
  });

  // ServiceTitan: customer + location + lead with the referral marker.
  let stBooked = false;
  const refs: Record<string, string> = {};
  if (isServiceTitanConfigured()) {
    try {
      let customerId: number;
      let locationId: number | null = null;
      const existing = await findCustomerByPhone(d.phone);
      if (existing) {
        customerId = existing.id;
        locationId = (await getCustomerLocations(customerId))[0]?.id ?? null;
        if (code && referralId) await markCustomerReferred(customerId, code);
      } else {
        const created = await createCustomerWithLocation({
          name: d.name.trim(),
          phone: d.phone.trim(),
          email,
          address: { street: d.street.trim(), unit: d.unit || null, city: d.city.trim(), state: d.state.toUpperCase(), zip: d.zip.trim() },
          referralCode: referralId ? code : null,
        });
        customerId = created.customerId;
        locationId = created.locationId;
      }
      const when =
        d.preferredWindow === "asap"
          ? "ASAP — call immediately"
          : `${d.preferredDay || "Any day"} ${d.preferredWindow === "morning" ? "AM" : d.preferredWindow === "afternoon" ? "PM" : ""}`.trim();
      const summaryLines = [
        `ONLINE BOOKING — ${svc.label}`,
        `Preferred: ${when}`,
        d.gateCode ? `Gate code: ${d.gateCode}` : null,
        d.dog ? "Dog on property: Yes" : null,
        d.notes ? `Notes: ${d.notes}` : null,
        referralId ? `REFERRAL — code ${code}${referredBy ? ` (referred by ${referredBy})` : ""} — friend gets ${friendOfferFor(campaign ?? { settings: null }) ?? "the referral offer"}; referrer bonus owed on completion.` : null,
      ].filter(Boolean);
      const lead = await createLead({
        customerId,
        locationId,
        businessUnitId: svc.businessUnitId,
        jobTypeId: svc.jobTypeId,
        campaignId: referralId ? ST_IDS.referralCampaignId : ST_IDS.onlineCampaignId,
        priority: svc.priority,
        summary: summaryLines.join("\n"),
      });
      refs.st_customer_id = String(customerId);
      if (locationId) refs.st_location_id = String(locationId);
      refs.st_lead_id = String(lead.id);
      stBooked = true;
    } catch (err) {
      console.error("ServiceTitan booking failed", err instanceof ServiceTitanError ? err.body : err);
    }
  }

  await db
    .update(contacts)
    .set({ externalRefs: sql`COALESCE(${contacts.externalRefs}, '{}'::jsonb) || ${JSON.stringify(refs)}::jsonb`, updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
  if (referralId) {
    await db
      .update(referrals)
      .set({ metadata: sql`COALESCE(${referrals.metadata}, '{}'::jsonb) || ${JSON.stringify({ ...refs, st_pending: !stBooked })}::jsonb`, updatedAt: new Date() })
      .where(eq(referrals.id, referralId));
    await emitReferralEvent(referralId, "booking.created", { service: svc.id, stBooked, ...refs });
  }

  return { ok: true, referred: Boolean(referralId), stBooked, contactId };
}
