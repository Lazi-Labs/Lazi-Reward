// Example: Points Engine - Core business logic for calculating and awarding points
// This demonstrates the pattern for rewards business logic with proper error handling

import { z } from 'zod'

// ============================================
// CONFIGURATION
// ============================================
const POINTS_CONFIG = {
  /** Points awarded per dollar spent on completed jobs */
  pointsPerDollar: 1,
  /** Bonus points for referring a new customer */
  referralBonusReferrer: 500,
  /** Welcome bonus points for referred customer */
  referralBonusReferred: 250,
  /** Bonus points for leaving a verified review */
  reviewBonus: 100,
  /** Points-to-dollar redemption rate */
  redemptionRate: 100, // 100 points = $1
  /** Months of inactivity before points expire */
  expiryMonths: 24,
} as const

// ============================================
// TIER CALCULATION
// ============================================
const TIER_THRESHOLDS = [
  { id: 1, name: 'Bronze',   minPoints: 0 },
  { id: 2, name: 'Silver',   minPoints: 1000 },
  { id: 3, name: 'Gold',     minPoints: 5000 },
  { id: 4, name: 'Platinum', minPoints: 15000 },
] as const

/**
 * Calculate the tier based on lifetime earned points.
 * IMPORTANT: Uses lifetime points, NOT current balance.
 */
export function calculateTier(lifetimePoints: number): typeof TIER_THRESHOLDS[number] {
  if (lifetimePoints < 0) {
    throw new Error('Lifetime points cannot be negative')
  }

  // Walk backwards through tiers to find the highest qualifying tier
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= TIER_THRESHOLDS[i].minPoints) {
      return TIER_THRESHOLDS[i]
    }
  }

  return TIER_THRESHOLDS[0] // Bronze as fallback (should never reach here)
}

/**
 * Calculate progress to next tier as a percentage (0-100).
 */
export function calculateTierProgress(lifetimePoints: number): {
  currentTier: typeof TIER_THRESHOLDS[number]
  nextTier: typeof TIER_THRESHOLDS[number] | null
  progressPercent: number
  pointsToNextTier: number
} {
  const currentTier = calculateTier(lifetimePoints)
  const currentIndex = TIER_THRESHOLDS.findIndex(t => t.id === currentTier.id)
  const nextTier = currentIndex < TIER_THRESHOLDS.length - 1
    ? TIER_THRESHOLDS[currentIndex + 1]
    : null

  if (!nextTier) {
    return { currentTier, nextTier: null, progressPercent: 100, pointsToNextTier: 0 }
  }

  const rangeStart = currentTier.minPoints
  const rangeEnd = nextTier.minPoints
  const pointsInRange = lifetimePoints - rangeStart
  const totalRange = rangeEnd - rangeStart

  return {
    currentTier,
    nextTier,
    progressPercent: Math.min(100, Math.round((pointsInRange / totalRange) * 100)),
    pointsToNextTier: rangeEnd - lifetimePoints,
  }
}

// ============================================
// POINTS CALCULATION
// ============================================

/** Input for calculating points from a completed job */
const JobPointsInputSchema = z.object({
  invoiceTotal: z.number(),
  jobStatus: z.string(),
  invoicePaidInFull: z.boolean(),
  tierMultiplier: z.number().positive().default(1.0),
})

type JobPointsInput = z.infer<typeof JobPointsInputSchema>

/**
 * Calculate points earned from a completed, paid job.
 * IMPORTANT: Only awards points for completed AND fully paid jobs.
 */
export function calculateJobPoints(input: JobPointsInput): number {
  const parsed = JobPointsInputSchema.parse(input)

  // Business rule: only completed, fully paid jobs earn points
  if (parsed.jobStatus !== 'Completed') {
    return 0
  }
  if (!parsed.invoicePaidInFull) {
    return 0
  }
  if (parsed.invoiceTotal <= 0) {
    return 0
  }

  const basePoints = Math.floor(parsed.invoiceTotal * POINTS_CONFIG.pointsPerDollar)
  const multipliedPoints = Math.floor(basePoints * parsed.tierMultiplier)

  return multipliedPoints
}

/**
 * Convert points to dollar value for redemption.
 */
export function pointsToDollars(points: number): number {
  if (points < 0) throw new Error('Points cannot be negative')
  return Number((points / POINTS_CONFIG.redemptionRate).toFixed(2))
}

/**
 * Convert dollar amount to points cost.
 */
export function dollarsToPoints(dollars: number): number {
  if (dollars < 0) throw new Error('Dollar amount cannot be negative')
  return Math.ceil(dollars * POINTS_CONFIG.redemptionRate)
}

/**
 * Check if an account has enough points for a redemption.
 */
export function canRedeem(currentPoints: number, pointsCost: number): {
  canRedeem: boolean
  shortfall: number
} {
  const shortfall = Math.max(0, pointsCost - currentPoints)
  return {
    canRedeem: currentPoints >= pointsCost,
    shortfall,
  }
}

/**
 * Calculate expiry date based on last activity.
 */
export function calculateExpiryDate(lastActivityAt: Date): Date {
  const expiry = new Date(lastActivityAt)
  expiry.setMonth(expiry.getMonth() + POINTS_CONFIG.expiryMonths)
  return expiry
}

// ============================================
// REFERRAL VALIDATION
// ============================================

/**
 * Validate that a referral is eligible for point awards.
 * IMPORTANT: Referral bonus only after referred customer's FIRST completed job.
 */
export function isReferralEligible(referral: {
  status: string
  referrerPointsAwarded: number
  firstJobId: number | null
}): { eligible: boolean; reason: string } {
  if (referral.referrerPointsAwarded > 0) {
    return { eligible: false, reason: 'Points already awarded for this referral' }
  }
  if (!referral.firstJobId) {
    return { eligible: false, reason: 'Referred customer has not completed their first job' }
  }
  if (referral.status === 'expired') {
    return { eligible: false, reason: 'Referral has expired' }
  }
  return { eligible: true, reason: 'Referral is eligible for points' }
}

export { POINTS_CONFIG, TIER_THRESHOLDS }
