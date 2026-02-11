import { describe, it, expect } from 'vitest';
import {
  calculateTier,
  calculatePointsFromJobAmount,
  calculateDiscountFromPoints,
  pointsNeededForNextTier,
  formatPoints,
  arePointsExpired,
} from './points';
import { Tier } from '@/lib/types/rewards';

const mockTiers: Tier[] = [
  {
    id: 1,
    name: 'Bronze',
    points_threshold: 0,
    benefits: ['Member benefits'],
    points_multiplier: 1.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Silver',
    points_threshold: 1000,
    benefits: ['5% bonus', 'Priority support'],
    points_multiplier: 1.05,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Gold',
    points_threshold: 5000,
    benefits: ['10% bonus', 'Free shipping'],
    points_multiplier: 1.1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('Points Utilities', () => {
  describe('calculateTier', () => {
    it('should return Bronze tier for 0 points', () => {
      const tier = calculateTier(0, mockTiers);
      expect(tier?.name).toBe('Bronze');
    });

    it('should return Silver tier for 1000+ points', () => {
      const tier = calculateTier(1000, mockTiers);
      expect(tier?.name).toBe('Silver');
    });

    it('should return Gold tier for 5000+ points', () => {
      const tier = calculateTier(5000, mockTiers);
      expect(tier?.name).toBe('Gold');
    });
  });

  describe('calculatePointsFromJobAmount', () => {
    it('should calculate points at 1:1 ratio by default', () => {
      const points = calculatePointsFromJobAmount(100);
      expect(points).toBe(100);
    });

    it('should apply multiplier', () => {
      const points = calculatePointsFromJobAmount(100, 1.1);
      expect(points).toBe(110);
    });
  });

  describe('calculateDiscountFromPoints', () => {
    it('should convert 100 points to $1', () => {
      const discount = calculateDiscountFromPoints(100);
      expect(discount).toBe(1);
    });

    it('should convert 500 points to $5', () => {
      const discount = calculateDiscountFromPoints(500);
      expect(discount).toBe(5);
    });
  });

  describe('pointsNeededForNextTier', () => {
    it('should return points needed for Silver from Bronze', () => {
      const needed = pointsNeededForNextTier(500, mockTiers);
      expect(needed).toBe(500);
    });

    it('should return null at max tier', () => {
      const needed = pointsNeededForNextTier(10000, mockTiers);
      expect(needed).toBeNull();
    });
  });

  describe('formatPoints', () => {
    it('should format points with commas', () => {
      const formatted = formatPoints(1000000);
      expect(formatted).toBe('1,000,000');
    });
  });

  describe('arePointsExpired', () => {
    it('should return false for recent activity', () => {
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      expect(arePointsExpired(recentDate)).toBe(false);
    });

    it('should return true for activity over 24 months ago', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 25);
      expect(arePointsExpired(oldDate)).toBe(true);
    });
  });
});
