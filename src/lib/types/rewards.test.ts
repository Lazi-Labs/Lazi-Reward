import { describe, it, expect } from 'vitest';
import {
  TierSchema,
  CustomerRewardsSchema,
  PointsTransactionSchema,
  RedemptionSchema,
  type Tier,
  type CustomerRewards,
  type PointsTransaction,
  type Redemption,
} from './rewards';

describe('TierSchema', () => {
  const validTier: Tier = {
    id: 1,
    name: 'Gold',
    points_threshold: 1000,
    benefits: ['Free shipping', '10% discount'],
    points_multiplier: 1.1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should validate correct tier data', () => {
    const result = TierSchema.safeParse(validTier);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validTier);
    }
  });

  it('should validate all tier names', () => {
    const tierNames: Tier['name'][] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

    tierNames.forEach((name) => {
      const tier = { ...validTier, name };
      const result = TierSchema.safeParse(tier);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid tier name', () => {
    const invalid = { ...validTier, name: 'Diamond' };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalid = { id: validTier.id, name: 'Gold' };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should accept empty benefits array', () => {
    const withEmpty = { ...validTier, benefits: [] };
    const result = TierSchema.safeParse(withEmpty);

    expect(result.success).toBe(true);
  });

  it('should reject invalid datetime format', () => {
    const invalid = { ...validTier, created_at: 'not-a-date' };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should validate ISO datetime strings', () => {
    const withDifferentDates = {
      ...validTier,
      created_at: '2024-01-15T10:30:45.123Z',
      updated_at: '2024-02-20T15:45:30.456Z',
    };
    const result = TierSchema.safeParse(withDifferentDates);

    expect(result.success).toBe(true);
  });

  it('should handle boundary values for points', () => {
    const boundary = { ...validTier, points_threshold: 0, points_multiplier: 1.0 };
    const result = TierSchema.safeParse(boundary);

    expect(result.success).toBe(true);
  });

  it('should reject non-array benefits', () => {
    const invalid = { ...validTier, benefits: 'not-an-array' };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should handle benefits with special characters', () => {
    const withSpecial = {
      ...validTier,
      benefits: ['Free shipping & handling', '10% off - limited time!'],
    };
    const result = TierSchema.safeParse(withSpecial);

    expect(result.success).toBe(true);
  });

  it('should reject non-number id', () => {
    const invalid = { ...validTier, id: 'not-a-number' };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });
});

describe('CustomerRewardsSchema', () => {
  const validRewards: CustomerRewards = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customer_id: 12345,
    current_points: 1500,
    lifetime_points: 5000,
    current_tier_id: 2,
    last_activity: '2024-01-01T00:00:00Z',
    points_expire_date: '2025-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should validate correct customer rewards data', () => {
    const result = CustomerRewardsSchema.safeParse(validRewards);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRewards);
    }
  });

  it('should reject invalid id UUID', () => {
    const invalid = { ...validRewards, id: 'not-a-uuid' };
    const result = CustomerRewardsSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should accept null current_tier_id', () => {
    const withNull = { ...validRewards, current_tier_id: null };
    const result = CustomerRewardsSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null last_activity', () => {
    const withNull = { ...validRewards, last_activity: null };
    const result = CustomerRewardsSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null points_expire_date', () => {
    const withNull = { ...validRewards, points_expire_date: null };
    const result = CustomerRewardsSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should handle zero points', () => {
    const withZero = {
      ...validRewards,
      current_points: 0,
      lifetime_points: 0,
    };
    const result = CustomerRewardsSchema.safeParse(withZero);

    expect(result.success).toBe(true);
  });

  it('should handle large point values', () => {
    const large = {
      ...validRewards,
      current_points: 999999,
      lifetime_points: 9999999,
    };
    const result = CustomerRewardsSchema.safeParse(large);

    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const invalid = { id: validRewards.id };
    const result = CustomerRewardsSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should reject non-number customer_id', () => {
    const invalid = { ...validRewards, customer_id: 'not-a-number' };
    const result = CustomerRewardsSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });
});

describe('PointsTransactionSchema', () => {
  const validTransaction: PointsTransaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customer_id: '223e4567-e89b-12d3-a456-426614174000',
    points_amount: 100,
    transaction_type: 'earned',
    reason: 'Purchase reward',
    external_ref: 'ORDER-123',
    created_by: 'system',
    metadata: { order_id: '123' },
    created_at: '2024-01-01T00:00:00Z',
  };

  it('should validate correct transaction data', () => {
    const result = PointsTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validTransaction);
    }
  });

  it('should validate earned transaction type', () => {
    const earned = { ...validTransaction, transaction_type: 'earned' as const };
    const result = PointsTransactionSchema.safeParse(earned);

    expect(result.success).toBe(true);
  });

  it('should validate redeemed transaction type', () => {
    const redeemed = { ...validTransaction, transaction_type: 'redeemed' as const };
    const result = PointsTransactionSchema.safeParse(redeemed);

    expect(result.success).toBe(true);
  });

  it('should validate expired transaction type', () => {
    const expired = { ...validTransaction, transaction_type: 'expired' as const };
    const result = PointsTransactionSchema.safeParse(expired);

    expect(result.success).toBe(true);
  });

  it('should validate adjusted transaction type', () => {
    const adjusted = { ...validTransaction, transaction_type: 'adjusted' as const };
    const result = PointsTransactionSchema.safeParse(adjusted);

    expect(result.success).toBe(true);
  });

  it('should reject invalid transaction type', () => {
    const invalid = { ...validTransaction, transaction_type: 'invalid' };
    const result = PointsTransactionSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should accept null reason', () => {
    const withNull = { ...validTransaction, reason: null };
    const result = PointsTransactionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null external_ref', () => {
    const withNull = { ...validTransaction, external_ref: null };
    const result = PointsTransactionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null metadata', () => {
    const withNull = { ...validTransaction, metadata: null };
    const result = PointsTransactionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should handle large point amounts', () => {
    const large = { ...validTransaction, points_amount: 999999 };
    const result = PointsTransactionSchema.safeParse(large);

    expect(result.success).toBe(true);
  });

  it('should handle negative point amounts', () => {
    const negative = { ...validTransaction, points_amount: -100 };
    const result = PointsTransactionSchema.safeParse(negative);

    // Points can be negative for adjustments
    expect(result.success).toBe(true);
  });

  it('should reject invalid customer_id UUID', () => {
    const invalid = { ...validTransaction, customer_id: 'not-a-uuid' };
    const result = PointsTransactionSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });
});

describe('RedemptionSchema', () => {
  const validRedemption: Redemption = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customer_id: '223e4567-e89b-12d3-a456-426614174000',
    points_redeemed: 500,
    discount_amount: 5,
    status: 'pending',
    redemption_code: 'ABC123',
    expires_at: '2025-01-01T00:00:00Z',
    claimed_at: null,
    fulfilled_at: null,
    notes: 'Test redemption',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should validate correct redemption data', () => {
    const result = RedemptionSchema.safeParse(validRedemption);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRedemption);
    }
  });

  it('should validate pending status', () => {
    const pending = { ...validRedemption, status: 'pending' as const };
    const result = RedemptionSchema.safeParse(pending);

    expect(result.success).toBe(true);
  });

  it('should validate claimed status', () => {
    const claimed = {
      ...validRedemption,
      status: 'claimed' as const,
      claimed_at: '2024-01-02T00:00:00Z',
    };
    const result = RedemptionSchema.safeParse(claimed);

    expect(result.success).toBe(true);
  });

  it('should validate fulfilled status', () => {
    const fulfilled = {
      ...validRedemption,
      status: 'fulfilled' as const,
      fulfilled_at: '2024-01-02T00:00:00Z',
    };
    const result = RedemptionSchema.safeParse(fulfilled);

    expect(result.success).toBe(true);
  });

  it('should validate cancelled status', () => {
    const cancelled = { ...validRedemption, status: 'cancelled' as const };
    const result = RedemptionSchema.safeParse(cancelled);

    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const invalid = { ...validRedemption, status: 'invalid' };
    const result = RedemptionSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('should accept null redemption_code', () => {
    const withNull = { ...validRedemption, redemption_code: null };
    const result = RedemptionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null expires_at', () => {
    const withNull = { ...validRedemption, expires_at: null };
    const result = RedemptionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null claimed_at', () => {
    const withNull = { ...validRedemption, claimed_at: null };
    const result = RedemptionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null fulfilled_at', () => {
    const withNull = { ...validRedemption, fulfilled_at: null };
    const result = RedemptionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should accept null notes', () => {
    const withNull = { ...validRedemption, notes: null };
    const result = RedemptionSchema.safeParse(withNull);

    expect(result.success).toBe(true);
  });

  it('should validate datetime for all nullable date fields', () => {
    const withDates = {
      ...validRedemption,
      expires_at: '2025-01-15T10:30:00Z',
      claimed_at: '2024-01-15T10:30:00Z',
      fulfilled_at: '2024-01-16T10:30:00Z',
    };
    const result = RedemptionSchema.safeParse(withDates);

    expect(result.success).toBe(true);
  });

  it('should handle large point values', () => {
    const large = {
      ...validRedemption,
      points_redeemed: 100000,
      discount_amount: 1000,
    };
    const result = RedemptionSchema.safeParse(large);

    expect(result.success).toBe(true);
  });

  it('should reject invalid customer_id UUID', () => {
    const invalid = { ...validRedemption, customer_id: 'not-a-uuid' };
    const result = RedemptionSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });
});

describe('Schema edge cases', () => {
  it('should reject completely empty objects', () => {
    const tierResult = TierSchema.safeParse({});
    const rewardsResult = CustomerRewardsSchema.safeParse({});
    const transactionResult = PointsTransactionSchema.safeParse({});
    const redemptionResult = RedemptionSchema.safeParse({});

    expect(tierResult.success).toBe(false);
    expect(rewardsResult.success).toBe(false);
    expect(transactionResult.success).toBe(false);
    expect(redemptionResult.success).toBe(false);
  });

  it('should provide detailed error messages', () => {
    const invalid = {
      id: 'not-a-number',
      name: 'InvalidTier',
      points_threshold: -1,
    };
    const result = TierSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('should validate all datetime formats consistently', () => {
    const dates = [
      '2024-01-01T00:00:00Z',
      '2024-01-01T00:00:00.000Z',
      '2024-12-31T23:59:59.999Z',
    ];

    dates.forEach((date) => {
      const transaction: PointsTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: '223e4567-e89b-12d3-a456-426614174000',
        points_amount: 100,
        transaction_type: 'earned',
        reason: null,
        external_ref: null,
        created_by: 'system',
        metadata: null,
        created_at: date,
      };
      const result = PointsTransactionSchema.safeParse(transaction);

      expect(result.success).toBe(true);
    });
  });
});

describe('Type inference', () => {
  it('should infer correct TypeScript types from TierSchema', () => {
    const tier: Tier = {
      id: 1,
      name: 'Gold',
      points_threshold: 1000,
      benefits: [],
      points_multiplier: 1.1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const result = TierSchema.parse(tier);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Gold');
  });

  it('should handle union types in transaction type', () => {
    const types: PointsTransaction['transaction_type'][] = [
      'earned',
      'redeemed',
      'expired',
      'adjusted',
    ];

    types.forEach((type) => {
      const transaction: PointsTransaction = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: '223e4567-e89b-12d3-a456-426614174000',
        points_amount: 100,
        transaction_type: type,
        reason: null,
        external_ref: null,
        created_by: 'system',
        metadata: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(transaction.transaction_type).toBe(type);
    });
  });

  it('should handle union types in redemption status', () => {
    const statuses: Redemption['status'][] = [
      'pending',
      'claimed',
      'fulfilled',
      'cancelled',
    ];

    statuses.forEach((status) => {
      const redemption: Redemption = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: '223e4567-e89b-12d3-a456-426614174000',
        points_redeemed: 100,
        discount_amount: 1,
        status,
        redemption_code: null,
        expires_at: null,
        claimed_at: null,
        fulfilled_at: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(redemption.status).toBe(status);
    });
  });
});
