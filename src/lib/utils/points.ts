import { Tier } from '@/lib/types/rewards';

/**
 * Calculate current tier based on lifetime points
 */
export function calculateTier(lifetimePoints: number, tiers: Tier[]): Tier | null {
  // Sort tiers by threshold in descending order
  const sortedTiers = [...tiers].sort((a, b) => b.points_threshold - a.points_threshold);
  
  for (const tier of sortedTiers) {
    if (lifetimePoints >= tier.points_threshold) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Calculate points to earn based on job amount
 * Business rule: 1 point per $1 spent
 */
export function calculatePointsFromJobAmount(amount: number, multiplier: number = 1.0): number {
  return Math.floor(amount * multiplier);
}

/**
 * Calculate discount from points redeemed
 * Business rule: 100 points = $1 discount
 */
export function calculateDiscountFromPoints(pointsRedeemed: number): number {
  return Math.floor(pointsRedeemed / 100);
}

/**
 * Calculate points needed to reach next tier
 */
export function pointsNeededForNextTier(
  lifetimePoints: number,
  tiers: Tier[]
): number | null {
  const sortedTiers = [...tiers].sort((a, b) => a.points_threshold - b.points_threshold);
  
  for (const tier of sortedTiers) {
    if (lifetimePoints < tier.points_threshold) {
      return tier.points_threshold - lifetimePoints;
    }
  }
  
  return null; // Already at max tier
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-US').format(points);
}

/**
 * Determine if points have expired (24 months of inactivity)
 */
export function arePointsExpired(lastActivity: Date): boolean {
  const now = new Date();
  const monthsInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24 * 30);
  return monthsInactive > 24;
}
