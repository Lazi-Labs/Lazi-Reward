import { z } from 'zod';

// Tier types
export const TierSchema = z.object({
  id: z.number(),
  name: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']),
  points_threshold: z.number(),
  benefits: z.array(z.string()),
  points_multiplier: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Tier = z.infer<typeof TierSchema>;

// Customer rewards schema
export const CustomerRewardsSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.number(),
  current_points: z.number(),
  lifetime_points: z.number(),
  current_tier_id: z.number().nullable(),
  last_activity: z.string().datetime().nullable(),
  points_expire_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CustomerRewards = z.infer<typeof CustomerRewardsSchema>;

// Points transaction types
export const PointsTransactionSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  points_amount: z.number(),
  transaction_type: z.enum(['earned', 'redeemed', 'adjusted', 'expired']),
  reason: z.string().nullable(),
  external_ref: z.string().nullable(),
  created_by: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

export type PointsTransaction = z.infer<typeof PointsTransactionSchema>;

// Redemption schema
export const RedemptionSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  points_redeemed: z.number(),
  discount_amount: z.number(),
  status: z.enum(['pending', 'claimed', 'fulfilled', 'cancelled']),
  redemption_code: z.string().nullable(),
  expires_at: z.string().datetime().nullable(),
  claimed_at: z.string().datetime().nullable(),
  fulfilled_at: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Redemption = z.infer<typeof RedemptionSchema>;

// API Response schema
export const ApiResponseSchema = z.object({
  data: z.unknown(),
  error: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type ApiResponse<T> = {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
} | {
  data: null;
  error: string;
  meta?: Record<string, unknown>;
};
