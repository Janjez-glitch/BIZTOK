import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultAffinityProfile,
  updateUserAffinity,
  calculateRankScore,
  rankFeed,
  FeedProduct,
} from './recommendationEngine';

const dummyProducts: FeedProduct[] = [
  {
    id: 'prod_1',
    title: 'Minimalist MagSafe Stand',
    price: 39,
    category: 'tech',
    videoUrl: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    sellerId: 's_tech_standard',
    sellerName: 'VoltGear Lab',
    sellerAvatar: '',
    sellerTier: 'STANDARD',
    isSellerVerified: true,
    baseLikes: 1200,
    baseShares: 340,
    historicalCtr: 0.12,
    avgWatchRatio: 0.75,
    publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    tags: ['tech', 'desksetup'],
    description: 'CNC machined magnetic phone stand.',
    stockCount: 45,
  },
  {
    id: 'prod_2',
    title: 'Pro Ceramic Pour-Over Dripper',
    price: 48,
    category: 'lifestyle',
    videoUrl: 'https://example.com/video2.mp4',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    sellerId: 's_coffee_premium',
    sellerName: 'Artisan Roast Co',
    sellerAvatar: '',
    sellerTier: 'PREMIUM', // Premium Tier account
    isSellerVerified: true,
    baseLikes: 2500,
    baseShares: 800,
    historicalCtr: 0.15,
    avgWatchRatio: 0.82,
    publishedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    tags: ['coffee', 'ceramics'],
    description: 'Handcrafted stoneware dripper.',
    stockCount: 15,
  },
  {
    id: 'prod_3',
    title: 'Oversized Japanese Denim Jacket',
    price: 110,
    category: 'fashion',
    videoUrl: 'https://example.com/video3.mp4',
    thumbnailUrl: 'https://example.com/thumb3.jpg',
    sellerId: 's_fashion_standard',
    sellerName: 'Indigo Threads',
    sellerAvatar: '',
    sellerTier: 'STANDARD',
    isSellerVerified: true,
    baseLikes: 950,
    baseShares: 210,
    historicalCtr: 0.08,
    avgWatchRatio: 0.65,
    publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    tags: ['denim', 'streetwear'],
    description: 'Raw selvedge boxy jacket.',
    stockCount: 20,
  },
];

test('createDefaultAffinityProfile initializes balanced category weights', () => {
  const profile = createDefaultAffinityProfile('user_test_1');
  assert.equal(profile.affinities.tech, 0.5);
  assert.equal(profile.affinities.fashion, 0.5);
  assert.equal(profile.affinities.lifestyle, 0.5);
});

test('updateUserAffinity decreases affinity on fast skip and increases on drawer open / like', () => {
  let profile = createDefaultAffinityProfile('user_test_2');

  // Fast skip on tech
  profile = updateUserAffinity(profile, {
    productId: 'prod_1',
    category: 'tech',
    watchTimeSeconds: 1.2,
    videoDurationSeconds: 15,
    action: 'SKIP_FAST',
  });
  assert.ok(profile.affinities.tech < 0.5, 'Tech affinity should decrease after fast skip');

  // High engagement on lifestyle
  profile = updateUserAffinity(profile, {
    productId: 'prod_2',
    category: 'lifestyle',
    watchTimeSeconds: 15,
    videoDurationSeconds: 15,
    action: 'OPEN_DRAWER',
  });
  assert.ok(profile.affinities.lifestyle > 0.5, 'Lifestyle affinity should increase after opening shop drawer');
});

test('calculateRankScore applies 1.35x multiplier for PREMIUM seller tier', () => {
  const profile = createDefaultAffinityProfile();
  const standardScore = calculateRankScore(dummyProducts[0], profile);
  assert.equal(standardScore.sellerTierMultiplier, 1.0);

  const premiumScore = calculateRankScore(dummyProducts[1], profile);
  assert.equal(premiumScore.sellerTierMultiplier, 1.35);
  assert.ok(premiumScore.finalScore > 0);
});

test('rankFeed ranks high affinity and premium products at the top', () => {
  let profile = createDefaultAffinityProfile();
  // Boost lifestyle affinity significantly
  profile.affinities.lifestyle = 0.95;
  profile.affinities.tech = 0.20;

  const ranked = rankFeed(dummyProducts, profile);
  assert.equal(ranked.length, 3);
  // Lifestyle with 0.95 affinity AND Premium tier should be ranked #1
  assert.equal(ranked[0].product.id, 'prod_2');
});
