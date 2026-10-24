/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductCategory = 'tech' | 'fashion' | 'lifestyle' | 'food' | 'wellness' | 'home';

export interface FeedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  videoUrl: string;
  thumbnailUrl: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerTier: 'PREMIUM' | 'STANDARD';
  isSellerVerified: boolean;
  baseLikes: number;
  baseShares: number;
  historicalCtr: number; // 0.0 - 1.0
  avgWatchRatio: number; // e.g. 0.85 (85% watched on average)
  publishedAt: string;
  tags: string[];
  description: string;
  stockCount: number;
  variants?: { name: string; options: string[] }[];
}

export interface UserInteractionTelemetry {
  productId: string;
  category: ProductCategory;
  watchTimeSeconds: number;
  videoDurationSeconds: number;
  action: 'SKIP_FAST' | 'WATCH_PARTIAL' | 'WATCH_COMPLETE' | 'LOOPED' | 'LIKE' | 'OPEN_DRAWER' | 'BUY';
  timestamp?: number;
}

export type CategoryAffinityMap = Record<ProductCategory, number>;

export interface UserAffinityProfile {
  userId: string;
  affinities: CategoryAffinityMap;
  recentViewedIds: string[];
  totalVideosWatched: number;
  lastActive: number;
}

export interface ScoreBreakdown {
  affinityScore: number;
  engagementScore: number;
  recencyScore: number;
  sellerTierMultiplier: number;
  diversityPenalty: number;
  finalScore: number;
}

export interface RankedFeedItem {
  product: FeedProduct;
  scoreBreakdown: ScoreBreakdown;
}

export const DEFAULT_CATEGORIES: ProductCategory[] = ['tech', 'fashion', 'lifestyle', 'food', 'wellness', 'home'];

/**
 * Creates a neutral initial affinity profile for a new user.
 */
export function createDefaultAffinityProfile(userId = 'user_guest'): UserAffinityProfile {
  const affinities: CategoryAffinityMap = {
    tech: 0.5,
    fashion: 0.5,
    lifestyle: 0.5,
    food: 0.5,
    wellness: 0.5,
    home: 0.5,
  };
  return {
    userId,
    affinities,
    recentViewedIds: [],
    totalVideosWatched: 0,
    lastActive: Date.now(),
  };
}

/**
 * Updates a user's category affinity vector in response to a swipe or engagement event.
 * Rewards high watch time, loops, likes, and shop drawer clicks.
 * Penalizes fast skips (< 2s).
 */
export function updateUserAffinity(
  profile: UserAffinityProfile,
  telemetry: UserInteractionTelemetry
): UserAffinityProfile {
  const currentAffinity = profile.affinities[telemetry.category] ?? 0.5;
  const watchRatio = telemetry.videoDurationSeconds > 0 
    ? telemetry.watchTimeSeconds / telemetry.videoDurationSeconds 
    : 0.5;

  let delta = 0;

  switch (telemetry.action) {
    case 'SKIP_FAST':
      // Swiped away within < 2 seconds
      delta = -0.15;
      break;
    case 'WATCH_PARTIAL':
      // Watched moderate duration (e.g. 30%-60%)
      delta = watchRatio > 0.4 ? 0.05 : -0.05;
      break;
    case 'WATCH_COMPLETE':
      // Watched full video
      delta = 0.15;
      break;
    case 'LOOPED':
      // Watched multiple times
      delta = 0.25;
      break;
    case 'LIKE':
      delta = 0.20;
      break;
    case 'OPEN_DRAWER':
      // Tapped on the product tag
      delta = 0.30;
      break;
    case 'BUY':
      delta = 0.40;
      break;
    default:
      delta = 0;
  }

  // Smooth updates using learning rate
  const learningRate = 0.4;
  const newRaw = currentAffinity + (delta * learningRate);
  const clamped = Math.max(0.05, Math.min(1.0, Number(newRaw.toFixed(4))));

  const updatedAffinities = {
    ...profile.affinities,
    [telemetry.category]: clamped,
  };

  const recentViewed = [telemetry.productId, ...profile.recentViewedIds.filter(id => id !== telemetry.productId)].slice(0, 50);

  return {
    ...profile,
    affinities: updatedAffinities,
    recentViewedIds: recentViewed,
    totalVideosWatched: profile.totalVideosWatched + 1,
    lastActive: Date.now(),
  };
}

/**
 * Calculates algorithmic ranking score for a single candidate product given a user's profile.
 */
export function calculateRankScore(
  product: FeedProduct,
  profile: UserAffinityProfile,
  previousCategory?: ProductCategory
): ScoreBreakdown {
  // 1. Category Affinity (0.05 to 1.0)
  const affinity = profile.affinities[product.category] ?? 0.5;
  const affinityWeight = 0.45;
  const affinityScore = affinity * affinityWeight;

  // 2. Historical Engagement Signal (CTR + Watch Ratio)
  const engagementBase = (product.historicalCtr * 0.4) + (product.avgWatchRatio * 0.6);
  const engagementWeight = 0.35;
  const engagementScore = engagementBase * engagementWeight;

  // 3. Recency / Freshness decay (Exponential half-life of 48 hours)
  const publishedDate = new Date(product.publishedAt).getTime();
  const ageInHours = Math.max(0, (Date.now() - publishedDate) / (1000 * 60 * 60));
  const halfLifeHours = 48;
  const freshness = Math.exp(-Math.LN2 * (ageInHours / halfLifeHours));
  const recencyWeight = 0.20;
  const recencyScore = freshness * recencyWeight;

  // Base raw score sum (normalized around ~0.0 to 1.0)
  const baseScore = affinityScore + engagementScore + recencyScore;

  // 4. Seller Tier Multiplier
  // Verified Premium Tier accounts receive a +35% distribution boost
  const sellerTierMultiplier = product.sellerTier === 'PREMIUM' ? 1.35 : 1.00;

  // 5. Category Diversity Penalty (avoids 3+ same category in a row)
  const diversityPenalty = previousCategory && previousCategory === product.category ? 0.85 : 1.00;

  // 6. Recently viewed dampening
  const recentlyViewedMultiplier = profile.recentViewedIds.slice(0, 5).includes(product.id) ? 0.3 : 1.0;

  const finalScore = Number(
    ((baseScore * sellerTierMultiplier * diversityPenalty * recentlyViewedMultiplier)).toFixed(4)
  );

  return {
    affinityScore: Number(affinityScore.toFixed(4)),
    engagementScore: Number(engagementScore.toFixed(4)),
    recencyScore: Number(recencyScore.toFixed(4)),
    sellerTierMultiplier,
    diversityPenalty,
    finalScore,
  };
}

/**
 * Re-ranks candidate feed products according to user swipe telemetry,
 * category affinity, and premium account tier weighting.
 */
export function rankFeed(
  candidates: FeedProduct[],
  profile: UserAffinityProfile
): RankedFeedItem[] {
  // First calculate scores
  const scored = candidates.map(product => {
    const scoreBreakdown = calculateRankScore(product, profile);
    return { product, scoreBreakdown };
  });

  // Sort descending by finalScore
  scored.sort((a, b) => b.scoreBreakdown.finalScore - a.scoreBreakdown.finalScore);

  // Apply sequential diversity re-ranking to prevent clustered categories
  const reRanked: RankedFeedItem[] = [];
  const pool = [...scored];

  while (pool.length > 0) {
    const lastCategory = reRanked.length > 0 ? reRanked[reRanked.length - 1].product.category : undefined;
    
    // Find best candidate that differs from lastCategory if possible
    let chosenIndex = pool.findIndex(item => item.product.category !== lastCategory);
    if (chosenIndex === -1) {
      chosenIndex = 0; // Fallback to first if all remaining are same category
    }

    const [chosen] = pool.splice(chosenIndex, 1);
    // Recalculate score with diversity context
    const updatedScore = calculateRankScore(chosen.product, profile, lastCategory);
    reRanked.push({
      product: chosen.product,
      scoreBreakdown: updatedScore,
    });
  }

  return reRanked;
}
