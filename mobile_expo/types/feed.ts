/**
 * BizTok Mobile - Feed TypeScript Definitions
 */

export type CategoryType = 'tech' | 'fashion' | 'lifestyle' | 'food' | 'wellness' | 'home';

export interface FeedProductItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: CategoryType;
  videoUrl: string;
  thumbnailUrl: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerTier: 'STANDARD' | 'PREMIUM';
  isSellerVerified: boolean;
  baseLikes: number;
  baseShares: number;
  historicalCtr: number;
  avgWatchRatio: number;
  publishedAt: string;
  tags: string[];
  description: string;
  stockCount: number;
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
  product: FeedProductItem;
  scoreBreakdown: ScoreBreakdown;
}

export interface SwipeInteractionPayload {
  userId?: string;
  productId: string;
  category: CategoryType;
  watchTimeSeconds: number;
  videoDurationSeconds: number;
  action: 'SKIP_FAST' | 'WATCH_PARTIAL' | 'WATCH_COMPLETE' | 'LOOPED' | 'LIKE' | 'OPEN_DRAWER' | 'BUY';
}

export interface UserAffinityProfile {
  userId: string;
  affinities: Record<string, number>;
  recentViewedIds: string[];
  totalVideosWatched: number;
  lastActive: string;
}
