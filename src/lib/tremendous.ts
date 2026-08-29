import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Tremendous REST client (https://developers.tremendous.com).
 * Sandbox: TEST_ key + https://testflight.tremendous.com/api/v2
 * Production: PROD_ key + https://api.tremendous.com/api/v2
 */

const DEFAULT_URL = "https://testflight.tremendous.com/api/v2";

function apiKey() {
  return process.env.TREMENDOUS_API_KEY?.trim() || null;
}

export function tremendousBaseUrl() {
  return (process.env.TREMENDOUS_API_URL?.trim() || DEFAULT_URL).replace(/\/+$/, "");
}

export function isTremendousConfigured() {
  return Boolean(apiKey());
}

export function isTremendousSandbox() {
  return tremendousBaseUrl().includes("testflight") || (apiKey() ?? "").startsWith("TEST_");
}

export class TremendousError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "TremendousError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = apiKey();
  if (!key) throw new TremendousError("Tremendous is not configured", 0, null);
  const res = await fetch(`${tremendousBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
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
      (json && typeof json === "object" && "errors" in json
        ? JSON.stringify((json as { errors: unknown }).errors)
        : null) ?? `${res.status} ${res.statusText}`;
    throw new TremendousError(`Tremendous ${method} ${path} failed: ${msg}`, res.status, json);
  }
  return json as T;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type CreateLinkRewardInput = {
  /** Idempotency key — a repeat with the same id returns the original order. */
  externalId: string;
  amount: number;
  currency?: string;
  recipientName: string;
  recipientEmail?: string | null;
  campaignId?: string | null;
  /** Used only when no campaign is set — falls back to a product list. */
  productIds?: string[];
};

export type CreatedReward = {
  orderId: string;
  rewardId: string;
  link: string | null;
  status: string;
};

type OrderResponse = {
  order: {
    id: string;
    external_id?: string | null;
    status: string;
    rewards?: Array<{
      id: string;
      delivery?: { method?: string; status?: string; link?: string | null };
    }>;
  };
};

export async function createLinkReward(input: CreateLinkRewardInput): Promise<CreatedReward> {
  const fundingSourceId = process.env.TREMENDOUS_FUNDING_SOURCE_ID?.trim() || "BALANCE";
  const reward: Record<string, unknown> = {
    value: { denomination: input.amount, currency_code: input.currency ?? "USD" },
    recipient: {
      name: input.recipientName,
      ...(input.recipientEmail ? { email: input.recipientEmail } : {}),
    },
    delivery: { method: "LINK" },
  };
  if (input.campaignId) reward.campaign_id = input.campaignId;
  else if (input.productIds?.length) reward.products = input.productIds;
  else throw new TremendousError("No campaign or products configured for this business", 0, null);

  const res = await request<OrderResponse>("POST", "/orders", {
    external_id: input.externalId,
    payment: { funding_source_id: fundingSourceId },
    reward,
  });
  const r = res.order.rewards?.[0];
  if (!r) throw new TremendousError("Order created without a reward", 0, res);
  return {
    orderId: res.order.id,
    rewardId: r.id,
    link: r.delivery?.link ?? null,
    status: res.order.status,
  };
}

type RewardResponse = {
  reward: { id: string; order_id: string; delivery?: { link?: string | null; status?: string } };
};

export async function getReward(rewardId: string) {
  const res = await request<RewardResponse>("GET", `/rewards/${encodeURIComponent(rewardId)}`);
  return res.reward;
}

// ── Catalog / funding ────────────────────────────────────────────────────────

export type TremendousProduct = { id: string; name: string; category: string; countries?: unknown };

export async function listProducts(country = "US") {
  const res = await request<{ products: TremendousProduct[] }>(
    "GET",
    `/products?country=${encodeURIComponent(country)}`,
  );
  return res.products;
}

export type FundingSource = {
  id: string;
  method: string;
  meta?: { available_cents?: number; pending_cents?: number };
};

export async function listFundingSources() {
  const res = await request<{ funding_sources: FundingSource[] }>("GET", "/funding_sources");
  return res.funding_sources;
}

/** Available balance in dollars across BALANCE-type sources, or null if unknown. */
export async function getBalance(): Promise<number | null> {
  try {
    const sources = await listFundingSources();
    const cents = sources
      .filter((s) => s.method === "balance" || s.method === "BALANCE")
      .reduce((sum, s) => sum + (s.meta?.available_cents ?? 0), 0);
    return cents / 100;
  } catch {
    return null;
  }
}

// ── Webhooks ─────────────────────────────────────────────────────────────────

export async function createWebhook(url: string) {
  return request<{ webhook: { id: string; url: string; private_key: string } }>(
    "POST",
    "/webhooks",
    { url },
  );
}

/** `Tremendous-Webhook-Signature: sha256=<hex>` — HMAC-SHA256 over the raw body. */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const provided = header.replace(/^sha256=/, "").trim();
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
}

export type TremendousWebhookEvent = {
  uuid?: string;
  event: string;
  payload?: {
    resource?: { id?: string; type?: string };
    meta?: Record<string, unknown>;
    reward?: { id?: string; order_id?: string; delivery?: { status?: string; link?: string } };
    order?: { id?: string; external_id?: string; status?: string };
  };
};
