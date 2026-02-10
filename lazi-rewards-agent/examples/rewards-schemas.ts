// Example: Zod schemas for LAZI Rewards entities
// These are shared between frontend and backend for consistent validation

import { z } from 'zod'

// ============================================
// TIER SCHEMAS
// ============================================
export const TierSchema = z.object({
  id: z.number(),
  name: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']),
  minLifetimePoints: z.number().int().nonnegative(),
  pointsMultiplier: z.number().positive(),
  benefits: z.array(z.string()),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string(),
  sortOrder: z.number().int(),
})

export type Tier = z.infer<typeof TierSchema>

// ============================================
// REWARDS ACCOUNT SCHEMAS
// ============================================
export const RewardsAccountSchema = z.object({
  id: z.string().uuid(),
  stCustomerId: z.number().int().positive(),
  email: z.string().email().nullable(),
  currentPoints: z.number().int().nonnegative(),
  lifetimePoints: z.number().int().nonnegative(),
  currentTierId: z.number().int().positive(),
  referralCode: z.string().nullable(),
  referredBy: z.string().uuid().nullable(),
  lastActivityAt: z.string().datetime(),
  pointsExpireAt: z.string().datetime().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type RewardsAccount = z.infer<typeof RewardsAccountSchema>

// ============================================
// POINTS TRANSACTION SCHEMAS
// ============================================
export const PointsTransactionTypeSchema = z.enum([
  'earn', 'redeem', 'expire', 'adjust', 'bonus', 'referral'
])

export const PointsSourceSchema = z.enum([
  'job_completion', 'referral', 'review', 'manual', 'redemption', 'expiry'
])

export const PointsTransactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  type: PointsTransactionTypeSchema,
  points: z.number().int(), // Can be negative for redemptions
  balanceAfter: z.number().int().nonnegative(),
  source: PointsSourceSchema,
  sourceRefId: z.string().nullable(),
  sourceDetails: z.record(z.unknown()).default({}),
  description: z.string().nullable(),
  initiatedBy: z.string(),
  createdAt: z.string().datetime(),
})

export type PointsTransaction = z.infer<typeof PointsTransactionSchema>

// ============================================
// INPUT SCHEMAS (for API requests)
// ============================================
export const AwardPointsInputSchema = z.object({
  accountId: z.string().uuid(),
  points: z.number().int().positive('Points must be positive'),
  source: PointsSourceSchema,
  sourceRefId: z.string().optional(),
  description: z.string().min(1).max(500),
  initiatedBy: z.string().min(1),
})

export type AwardPointsInput = z.infer<typeof AwardPointsInputSchema>

export const RedeemPointsInputSchema = z.object({
  accountId: z.string().uuid(),
  catalogItemId: z.number().int().positive(),
  notes: z.string().max(500).optional(),
})

export type RedeemPointsInput = z.infer<typeof RedeemPointsInputSchema>

export const CreateReferralInputSchema = z.object({
  referrerAccountId: z.string().uuid(),
  referredName: z.string().min(1).max(200),
  referredEmail: z.string().email().optional(),
  referredPhone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
}).refine(
  (data) => data.referredEmail || data.referredPhone,
  { message: 'Either email or phone is required' }
)

export type CreateReferralInput = z.infer<typeof CreateReferralInputSchema>

// ============================================
// API RESPONSE SCHEMAS
// ============================================
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().nullable().default(null),
    meta: z.object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }).optional(),
  })

export const PaginationInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.infer<typeof PaginationInputSchema>
