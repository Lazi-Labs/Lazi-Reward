/**
 * Minimal ServiceTitan v2 client (client-credentials OAuth). Used by the
 * booking wizard to create the customer/location/lead with the referral marker,
 * and by the referral poller to check completed jobs.
 *
 * Env: ST_CLIENT_ID, ST_CLIENT_SECRET, ST_APP_KEY, ST_TENANT_ID,
 *      ST_REFERRAL_CODE_FIELD_ID (customer custom field), ST_REFERRED_TAG_ID,
 *      ST_REFERRAL_CAMPAIGN_ID, ST_ONLINE_CAMPAIGN_ID
 */

const AUTH_URL = "https://auth.servicetitan.io/connect/token";
const API = "https://api.servicetitan.io";

export function isServiceTitanConfigured() {
  return Boolean(
    process.env.ST_CLIENT_ID &&
      process.env.ST_CLIENT_SECRET &&
      process.env.ST_APP_KEY &&
      process.env.ST_TENANT_ID,
  );
}

export const ST_IDS = {
  get referralCodeFieldId() {
    const v = Number(process.env.ST_REFERRAL_CODE_FIELD_ID);
    return Number.isFinite(v) && v > 0 ? v : null;
  },
  get referredTagId() {
    const v = Number(process.env.ST_REFERRED_TAG_ID);
    return Number.isFinite(v) && v > 0 ? v : null;
  },
  get referralCampaignId() {
    return Number(process.env.ST_REFERRAL_CAMPAIGN_ID || 53538824);
  },
  get onlineCampaignId() {
    return Number(process.env.ST_ONLINE_CAMPAIGN_ID || 55647110);
  },
};

export class ServiceTitanError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "ServiceTitanError";
  }
}

let tokenCache: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 30_000) return tokenCache.token;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.ST_CLIENT_ID!,
      client_secret: process.env.ST_CLIENT_SECRET!,
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new ServiceTitanError(`ServiceTitan auth failed: ${json.error ?? res.status}`, res.status, json);
  }
  tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 900) * 1000 };
  return json.access_token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!isServiceTitanConfigured()) throw new ServiceTitanError("ServiceTitan is not configured", 0, null);
  const t = await token();
  const url = `${API}${path.replace("{tenant}", process.env.ST_TENANT_ID!)}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${t}`,
      "ST-App-Key": process.env.ST_APP_KEY!,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "title" in json
        ? String((json as { title: unknown }).title)
        : `${res.status} ${res.statusText}`;
    throw new ServiceTitanError(`ServiceTitan ${method} ${path} failed: ${msg}`, res.status, json);
  }
  return json as T;
}

// ── Customers ────────────────────────────────────────────────────────────────

export type StCustomer = {
  id: number;
  name: string;
  active: boolean;
  customFields?: { typeId: number; name: string; value: string }[];
  tagTypeIds?: number[];
  phoneSettings?: unknown;
};

/**
 * Find the customer for this phone. Phones are shared across households /
 * test records, so a match must also look like the same person: exactly one
 * result, or one whose name shares a word (last name) with `name`. Otherwise
 * null → the caller creates a fresh customer instead of attaching to a stranger.
 */
export async function findCustomerByPhone(phone: string, name?: string): Promise<StCustomer | null> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return null;
  const res = await request<{ data: StCustomer[] }>(
    "GET",
    `/crm/v2/tenant/{tenant}/customers?phone=${encodeURIComponent(digits)}&active=True&pageSize=10`,
  );
  const rows = res.data ?? [];
  if (rows.length === 0) return null;
  if (rows.length === 1 && !name) return rows[0];
  const words = (name ?? "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3);
  const scored = rows
    .map((r) => {
      const rn = r.name.toLowerCase();
      const hits = words.filter((w) => rn.includes(w)).length;
      return { r, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  if (scored.length) return scored[0].r;
  return rows.length === 1 ? rows[0] : null;
}

export async function getCustomer(id: number): Promise<StCustomer> {
  return request<StCustomer>("GET", `/crm/v2/tenant/{tenant}/customers/${id}`);
}

export async function getCustomerLocations(customerId: number): Promise<{ id: number; name: string }[]> {
  const res = await request<{ data: { id: number; name: string }[] }>(
    "GET",
    `/crm/v2/tenant/{tenant}/locations?customerId=${customerId}&active=True&pageSize=10`,
  );
  return res.data ?? [];
}

export type CreateCustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  address: { street: string; unit?: string | null; city: string; state: string; zip: string };
  referralCode?: string | null;
};

/** Creates customer + location in one call; returns both ids. */
export async function createCustomerWithLocation(input: CreateCustomerInput) {
  const contacts = [
    { type: "MobilePhone", value: input.phone, memo: "Booked online" },
    ...(input.email ? [{ type: "Email", value: input.email, memo: null as string | null }] : []),
  ];
  const address = {
    street: input.address.street,
    unit: input.address.unit ?? null,
    city: input.address.city,
    state: input.address.state,
    zip: input.address.zip,
    country: "USA",
  };
  const customFields =
    input.referralCode && ST_IDS.referralCodeFieldId
      ? [{ typeId: ST_IDS.referralCodeFieldId, value: input.referralCode }]
      : [];
  const tagTypeIds = input.referralCode && ST_IDS.referredTagId ? [ST_IDS.referredTagId] : [];

  const customer = await request<{ id: number; locations?: { id: number }[] }>(
    "POST",
    `/crm/v2/tenant/{tenant}/customers`,
    {
      name: input.name,
      type: "Residential",
      address,
      contacts,
      customFields,
      tagTypeIds,
      locations: [{ name: input.name, address, contacts, tagTypeIds, customFields: [] }],
    },
  );
  let locationId = customer.locations?.[0]?.id ?? null;
  if (!locationId) {
    const locs = await getCustomerLocations(customer.id);
    locationId = locs[0]?.id ?? null;
  }
  return { customerId: customer.id, locationId };
}

/** Stamp the referral marker on an existing customer (tag + custom field). */
export async function markCustomerReferred(customerId: number, referralCode: string) {
  const patch: Record<string, unknown> = {};
  const existing = await getCustomer(customerId);
  if (ST_IDS.referralCodeFieldId) {
    const others = (existing.customFields ?? []).filter((f) => f.typeId !== ST_IDS.referralCodeFieldId);
    patch.customFields = [
      ...others.map((f) => ({ typeId: f.typeId, value: f.value })),
      { typeId: ST_IDS.referralCodeFieldId, value: referralCode },
    ];
  }
  if (ST_IDS.referredTagId) {
    patch.tagTypeIds = Array.from(new Set([...(existing.tagTypeIds ?? []), ST_IDS.referredTagId]));
  }
  if (Object.keys(patch).length) {
    await request("PATCH", `/crm/v2/tenant/{tenant}/customers/${customerId}`, patch);
  }
}

// ── Leads ────────────────────────────────────────────────────────────────────

export type CreateLeadInput = {
  customerId: number;
  locationId: number | null;
  businessUnitId: number;
  jobTypeId: number;
  campaignId: number;
  priority: "Low" | "Normal" | "High" | "Urgent";
  summary: string;
  /** ST requires a follow-up date (or call reason). Defaults to tomorrow 9am ET; emergencies = now. */
  followUpDate?: Date;
};

export async function createLead(input: CreateLeadInput) {
  const followUp = input.followUpDate ?? (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(13, 0, 0, 0); // 9:00 ET
    return d;
  })();
  const res = await request<{ id: number; status?: string }>(
    "POST",
    `/crm/v2/tenant/{tenant}/leads`,
    {
      customerId: input.customerId,
      locationId: input.locationId ?? undefined,
      businessUnitId: input.businessUnitId,
      jobTypeId: input.jobTypeId,
      campaignId: input.campaignId,
      priority: input.priority,
      summary: input.summary,
      followUpDate: followUp.toISOString(),
    },
  );
  return res;
}

export async function getLead(id: number) {
  return request<{ id: number; status: string; jobId?: number | null }>(
    "GET",
    `/crm/v2/tenant/{tenant}/leads/${id}`,
  );
}

// ── Jobs (poller) ────────────────────────────────────────────────────────────

export type StJob = {
  id: number;
  jobNumber: string;
  customerId: number;
  jobStatus: string;
  completedOn: string | null;
  campaignId?: number | null;
  total?: number | null;
  businessUnitId?: number;
};

export async function listCompletedJobsForCustomer(customerId: number, since: Date): Promise<StJob[]> {
  const res = await request<{ data: StJob[] }>(
    "GET",
    `/jpm/v2/tenant/{tenant}/jobs?customerId=${customerId}&jobStatus=Completed&completedOnOrAfter=${encodeURIComponent(
      since.toISOString(),
    )}&pageSize=20`,
  );
  return res.data ?? [];
}

// ── Catalog the wizard offers ────────────────────────────────────────────────

export const BUSINESS_UNITS = { pool: 26143, electrical: 54670601 } as const;

export type ServiceOption = {
  id: string;
  label: string;
  hint: string;
  businessUnitId: number;
  jobTypeId: number;
  priority: CreateLeadInput["priority"];
  emergency?: boolean;
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "pool-diag", label: "Pool equipment isn't working", hint: "Pump, heater, filter, salt system, lights", businessUnitId: BUSINESS_UNITS.pool, jobTypeId: 63828493, priority: "Normal" },
  { id: "pool-automation", label: "Pool automation / controls", hint: "Programming, app, controller issues", businessUnitId: BUSINESS_UNITS.pool, jobTypeId: 53842495, priority: "Normal" },
  { id: "pool-estimate", label: "Pool equipment upgrade or install", hint: "Free estimate for new equipment", businessUnitId: BUSINESS_UNITS.pool, jobTypeId: 41094, priority: "Normal" },
  { id: "elec-diag", label: "Electrical problem at my home", hint: "Breakers, outlets, panel, no power", businessUnitId: BUSINESS_UNITS.electrical, jobTypeId: 54903609, priority: "Normal" },
  { id: "elec-estimate", label: "Electrical project estimate", hint: "Panel upgrade, EV charger, generator, lighting", businessUnitId: BUSINESS_UNITS.electrical, jobTypeId: 60072328, priority: "Normal" },
  { id: "pool-emergency", label: "Pool emergency", hint: "Sparking, smoke, gas smell, flooding", businessUnitId: BUSINESS_UNITS.pool, jobTypeId: 63809932, priority: "Urgent", emergency: true },
  { id: "elec-emergency", label: "Electrical emergency", hint: "Sparking, burning smell, no power", businessUnitId: BUSINESS_UNITS.electrical, jobTypeId: 63810957, priority: "Urgent", emergency: true },
];

export function serviceOption(id: string) {
  return SERVICE_OPTIONS.find((o) => o.id === id) ?? null;
}
