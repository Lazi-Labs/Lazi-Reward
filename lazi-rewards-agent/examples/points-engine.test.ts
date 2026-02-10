// Example: Unit tests for the Points Engine
// Demonstrates testing patterns for LAZI Rewards

import { describe, it, expect } from 'vitest'
import {
  calculateTier,
  calculateTierProgress,
  calculateJobPoints,
  pointsToDollars,
  dollarsToPoints,
  canRedeem,
  calculateExpiryDate,
  isReferralEligible,
  TIER_THRESHOLDS,
} from '../points-engine'

// ============================================
// TIER CALCULATION TESTS
// ============================================
describe('calculateTier', () => {
  it('returns Bronze for 0 points', () => {
    expect(calculateTier(0)).toMatchObject({ name: 'Bronze' })
  })

  it('returns Silver at exactly 1000 points', () => {
    expect(calculateTier(1000)).toMatchObject({ name: 'Silver' })
  })

  it('returns Silver at 999 points (still Bronze threshold)', () => {
    expect(calculateTier(999)).toMatchObject({ name: 'Bronze' })
  })

  it('returns Gold at 5000 points', () => {
    expect(calculateTier(5000)).toMatchObject({ name: 'Gold' })
  })

  it('returns Platinum at 15000 points', () => {
    expect(calculateTier(15000)).toMatchObject({ name: 'Platinum' })
  })

  it('returns Platinum for very high points', () => {
    expect(calculateTier(100000)).toMatchObject({ name: 'Platinum' })
  })

  it('throws for negative points', () => {
    expect(() => calculateTier(-1)).toThrow('Lifetime points cannot be negative')
  })
})

// ============================================
// TIER PROGRESS TESTS
// ============================================
describe('calculateTierProgress', () => {
  it('shows 0% progress at start of tier', () => {
    const result = calculateTierProgress(0)
    expect(result.currentTier.name).toBe('Bronze')
    expect(result.nextTier?.name).toBe('Silver')
    expect(result.progressPercent).toBe(0)
    expect(result.pointsToNextTier).toBe(1000)
  })

  it('shows 50% progress halfway through Bronze', () => {
    const result = calculateTierProgress(500)
    expect(result.progressPercent).toBe(50)
    expect(result.pointsToNextTier).toBe(500)
  })

  it('shows 100% progress at max tier', () => {
    const result = calculateTierProgress(20000)
    expect(result.currentTier.name).toBe('Platinum')
    expect(result.nextTier).toBeNull()
    expect(result.progressPercent).toBe(100)
    expect(result.pointsToNextTier).toBe(0)
  })
})

// ============================================
// JOB POINTS CALCULATION TESTS
// ============================================
describe('calculateJobPoints', () => {
  it('awards 1 point per dollar for completed paid job', () => {
    const points = calculateJobPoints({
      invoiceTotal: 1500,
      jobStatus: 'Completed',
      invoicePaidInFull: true,
      tierMultiplier: 1.0,
    })
    expect(points).toBe(1500)
  })

  it('applies tier multiplier correctly', () => {
    const points = calculateJobPoints({
      invoiceTotal: 1000,
      jobStatus: 'Completed',
      invoicePaidInFull: true,
      tierMultiplier: 1.25, // Gold tier
    })
    expect(points).toBe(1250)
  })

  it('returns 0 for incomplete jobs', () => {
    const points = calculateJobPoints({
      invoiceTotal: 1500,
      jobStatus: 'InProgress',
      invoicePaidInFull: true,
      tierMultiplier: 1.0,
    })
    expect(points).toBe(0)
  })

  it('returns 0 for unpaid invoices', () => {
    const points = calculateJobPoints({
      invoiceTotal: 1500,
      jobStatus: 'Completed',
      invoicePaidInFull: false,
      tierMultiplier: 1.0,
    })
    expect(points).toBe(0)
  })

  it('returns 0 for zero-dollar invoices', () => {
    const points = calculateJobPoints({
      invoiceTotal: 0,
      jobStatus: 'Completed',
      invoicePaidInFull: true,
      tierMultiplier: 1.0,
    })
    expect(points).toBe(0)
  })

  it('floors fractional points', () => {
    const points = calculateJobPoints({
      invoiceTotal: 99.99,
      jobStatus: 'Completed',
      invoicePaidInFull: true,
      tierMultiplier: 1.0,
    })
    expect(points).toBe(99) // Floor, not round
  })
})

// ============================================
// CONVERSION TESTS
// ============================================
describe('pointsToDollars', () => {
  it('converts 100 points to $1', () => {
    expect(pointsToDollars(100)).toBe(1.00)
  })

  it('converts 250 points to $2.50', () => {
    expect(pointsToDollars(250)).toBe(2.50)
  })

  it('converts 0 points to $0', () => {
    expect(pointsToDollars(0)).toBe(0)
  })

  it('throws for negative points', () => {
    expect(() => pointsToDollars(-100)).toThrow('Points cannot be negative')
  })
})

describe('dollarsToPoints', () => {
  it('converts $1 to 100 points', () => {
    expect(dollarsToPoints(1)).toBe(100)
  })

  it('rounds up fractional points', () => {
    expect(dollarsToPoints(1.01)).toBe(101) // Ceil, not floor
  })

  it('throws for negative dollars', () => {
    expect(() => dollarsToPoints(-5)).toThrow('Dollar amount cannot be negative')
  })
})

// ============================================
// REDEMPTION TESTS
// ============================================
describe('canRedeem', () => {
  it('allows redemption with sufficient points', () => {
    const result = canRedeem(1000, 500)
    expect(result.canRedeem).toBe(true)
    expect(result.shortfall).toBe(0)
  })

  it('allows redemption with exact points', () => {
    const result = canRedeem(500, 500)
    expect(result.canRedeem).toBe(true)
    expect(result.shortfall).toBe(0)
  })

  it('denies redemption with insufficient points', () => {
    const result = canRedeem(300, 500)
    expect(result.canRedeem).toBe(false)
    expect(result.shortfall).toBe(200)
  })
})

// ============================================
// EXPIRY TESTS
// ============================================
describe('calculateExpiryDate', () => {
  it('returns date 24 months in the future', () => {
    const now = new Date('2025-01-15')
    const expiry = calculateExpiryDate(now)
    expect(expiry.getFullYear()).toBe(2027)
    expect(expiry.getMonth()).toBe(0) // January
    expect(expiry.getDate()).toBe(15)
  })
})

// ============================================
// REFERRAL ELIGIBILITY TESTS
// ============================================
describe('isReferralEligible', () => {
  it('is eligible when first job is complete and no points awarded', () => {
    const result = isReferralEligible({
      status: 'first_job_complete',
      referrerPointsAwarded: 0,
      firstJobId: 12345,
    })
    expect(result.eligible).toBe(true)
  })

  it('is ineligible when points already awarded', () => {
    const result = isReferralEligible({
      status: 'points_awarded',
      referrerPointsAwarded: 500,
      firstJobId: 12345,
    })
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('already awarded')
  })

  it('is ineligible when no first job yet', () => {
    const result = isReferralEligible({
      status: 'signed_up',
      referrerPointsAwarded: 0,
      firstJobId: null,
    })
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('first job')
  })

  it('is ineligible when expired', () => {
    const result = isReferralEligible({
      status: 'expired',
      referrerPointsAwarded: 0,
      firstJobId: 12345,
    })
    expect(result.eligible).toBe(false)
    expect(result.reason).toContain('expired')
  })
})
