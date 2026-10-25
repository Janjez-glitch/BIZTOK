/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  verifyBusinessOnboarding,
  enforceVerifiedMerchant,
  MerchantAccount,
  BusinessVerificationRequest
} from './src/lib/businessVerification.ts';
import {
  rankFeed,
  updateUserAffinity,
  createDefaultAffinityProfile,
  FeedProduct,
  UserAffinityProfile,
  UserInteractionTelemetry
} from './src/lib/recommendationEngine.ts';
import {
  initiateMPesaSTKPush,
  createEscrowOrder,
  attachShippingTracking,
  releaseEscrowFunds,
  EscrowOrder,
  PaymentMethodType
} from './src/lib/escrowEngine.ts';
import {
  TOKGIFT_CATALOG,
  sendTokGift,
  dispatchPhysicalGift,
  PhysicalGiftDispatchRecord,
  TokGiftItem
} from './src/lib/tokGifts.ts';
import {
  PUDO_HUBS,
  LOGISTICS_PROVIDERS,
  MOCK_DRIVERS,
  calculateLogisticsQuotes,
  generateHandshakeCredentials,
  verifySellerPickupHandshake,
  verifyBuyerDeliveryHandshake,
  generateLegalWaybill,
  simulateRiderMovement,
  ShipmentHandshake,
  LogisticsTier,
  DeliveryMethod,
  PudoLocation,
} from './src/lib/logisticsAggregator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Shared Gemini client instance with aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Seed data: Active merchants
let currentMerchant: MerchantAccount = {
  merchantId: 'merch_prime_1',
  businessName: 'Nordic Clayworks & Design Inc',
  isVerified: false, // Starts unverified to demonstrate strict gating!
  tier: 'PREMIUM',
  idNumber: '',
  country: 'US',
  createdAt: new Date().toISOString(),
};

// Seed candidate products in marketplace
let productCatalog: FeedProduct[] = [
  {
    id: 'prod_orbit_magsafe',
    title: 'OrbitFlow 3-in-1 Foldable MagSafe Dock',
    price: 49.00,
    originalPrice: 69.00,
    category: 'tech',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41530-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    sellerTier: 'PREMIUM',
    isSellerVerified: true,
    baseLikes: 5820,
    baseShares: 1420,
    historicalCtr: 0.18,
    avgWatchRatio: 0.88,
    publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    tags: ['desksetup', 'tech', 'wireless', 'magsafe'],
    description: 'Aircraft-grade anodized aluminum fast wireless charging dock with thermal cooling and tactile hinge.',
    stockCount: 84,
    variants: [
      { name: 'Finish', options: ['Space Gray', 'Matte Silver', 'Midnight Black'] }
    ]
  },
  {
    id: 'prod_komorebi_mug',
    title: 'Komorebi Speckled Stoneware Ceramic Mug',
    price: 34.00,
    originalPrice: 42.00,
    category: 'lifestyle',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-41551-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    sellerId: 'merch_ceramics_kyoto',
    sellerName: 'Komorebi Clayworks',
    sellerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    sellerTier: 'PREMIUM',
    isSellerVerified: true,
    baseLikes: 6890,
    baseShares: 980,
    historicalCtr: 0.16,
    avgWatchRatio: 0.85,
    publishedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    tags: ['ceramics', 'coffee', 'handmade', 'slowliving'],
    description: 'Double-fired stoneware with raw unglazed exterior and food-safe speckled ivory interior.',
    stockCount: 22,
    variants: [
      { name: 'Capacity', options: ['350ml Standard', '450ml Grande'] }
    ]
  },
  {
    id: 'prod_raw_denim_jacket',
    title: 'Kuroki Mills 14oz Raw Selvedge Boxy Jacket',
    price: 185.00,
    originalPrice: 220.00,
    category: 'fashion',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-vintage-store-looking-at-clothes-41556-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    sellerId: 'merch_kuroki_denim',
    sellerName: 'Atelier Indigo',
    sellerAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=160&q=80',
    sellerTier: 'STANDARD',
    isSellerVerified: true,
    baseLikes: 3410,
    baseShares: 430,
    historicalCtr: 0.11,
    avgWatchRatio: 0.74,
    publishedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    tags: ['denim', 'rawdenim', 'streetwear', 'ootd'],
    description: 'Woven on restored vintage Toyoda shuttle looms in Okayama. Natural indigo rope-dyed warp.',
    stockCount: 16,
    variants: [
      { name: 'Size', options: ['Small', 'Medium', 'Large', 'X-Large'] }
    ]
  },
  {
    id: 'prod_uji_matcha_kit',
    title: 'Uji Ceremonial First-Harvest Matcha Ritual Set',
    price: 52.00,
    originalPrice: 65.00,
    category: 'food',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-a-glass-of-iced-coffee-41550-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    sellerId: 'merch_uji_matcha',
    sellerName: 'Tencha Heritage',
    sellerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    sellerTier: 'PREMIUM',
    isSellerVerified: true,
    baseLikes: 5980,
    baseShares: 1640,
    historicalCtr: 0.17,
    avgWatchRatio: 0.82,
    publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    tags: ['matcha', 'ceremonial', 'wellness', 'kyoto'],
    description: 'Stone-milled shade-grown green tea leaves. Includes handcrafted 100-prong bamboo chasen and glazed chawan.',
    stockCount: 35
  },
  {
    id: 'prod_helios_ambient_lamp',
    title: 'Helios Dimmable Wireless Ambient Sphere',
    price: 68.00,
    originalPrice: 89.00,
    category: 'home',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-working-on-a-clay-vase-41549-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    sellerId: 'merch_lumen_co',
    sellerName: 'Lumen Studio',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    sellerTier: 'STANDARD',
    isSellerVerified: true,
    baseLikes: 2450,
    baseShares: 320,
    historicalCtr: 0.10,
    avgWatchRatio: 0.70,
    publishedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    tags: ['homedecor', 'ambientlighting', 'warmminimalism'],
    description: 'Touch capacitive dimming with ultra-warm 2200K sunset amber glow. 24-hour USB-C rechargeable battery.',
    stockCount: 40
  }
];

// Active user profile in memory
let userProfile: UserAffinityProfile = createDefaultAffinityProfile('user_demo_1');

// In-Memory Escrow Orders Store
let escrowOrders: EscrowOrder[] = [
  {
    orderId: 'ord_escrow_101',
    productId: 'prod_orbit_magsafe',
    productTitle: 'OrbitFlow 3-in-1 Foldable MagSafe Dock',
    amount: 49.00,
    currency: 'USD',
    buyerId: 'buyer_alex_1',
    buyerName: 'Alex Mwangi',
    buyerPhone: '254712345678',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    paymentMethod: 'MPESA_STK',
    paymentReference: 'MPESA_DAR_9921',
    escrowStatus: 'FUNDS_LOCKED_IN_ESCROW',
    escrowHoldAmount: 49.00,
    platformFee: 2.45,
    merchantPayoutAmount: 46.55,
    shippingAddress: 'Nairobi Innovation Hub, Kilimani Road, Nairobi',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    orderId: 'ord_escrow_102',
    productId: 'prod_komorebi_mug',
    productTitle: 'Komorebi Speckled Stoneware Ceramic Mug',
    amount: 34.00,
    currency: 'USD',
    buyerId: 'buyer_priya_2',
    buyerName: 'Priya Patel',
    buyerPhone: '+14155552671',
    sellerId: 'merch_ceramics_kyoto',
    sellerName: 'Komorebi Clayworks',
    paymentMethod: 'CARD',
    paymentReference: 'CARD_STRIPE_44819',
    escrowStatus: 'SHIPPED_TRACKING_GENERATED',
    escrowHoldAmount: 34.00,
    platformFee: 1.70,
    merchantPayoutAmount: 32.30,
    trackingNumber: 'FDX-8829104-US',
    carrier: 'FedEx',
    shippingAddress: '742 Evergreen Terrace, Portland, OR',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    shippedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    orderId: 'ord_escrow_103',
    productId: 'prod_raw_denim_jacket',
    productTitle: 'Kuroki Mills 14oz Raw Selvedge Boxy Jacket',
    amount: 185.00,
    currency: 'USD',
    buyerId: 'buyer_marcus_3',
    buyerName: 'Marcus Vance',
    sellerId: 'merch_kuroki_denim',
    sellerName: 'Atelier Indigo',
    paymentMethod: 'CARD',
    paymentReference: 'CARD_STRIPE_99182',
    escrowStatus: 'DELIVERED_ESCROW_RELEASED',
    escrowHoldAmount: 0,
    platformFee: 9.25,
    merchantPayoutAmount: 175.75,
    trackingNumber: 'DHL-994182-EXP',
    carrier: 'DHL',
    shippingAddress: '102 Shoreditch High St, London E1 6JQ',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    shippedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    releasedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  }
];

// In-Memory Physical TokGift Dispatch Queue
let giftDispatchQueue: PhysicalGiftDispatchRecord[] = [
  {
    dispatchId: 'dispatch_gift_initial_1',
    giftId: 'gift_coffee_bean',
    giftName: 'Coffee Bean Token',
    giftPrice: 4.50,
    recipientCreatorId: 'merch_prime_1',
    recipientCreatorName: 'OrbitFlow Labs',
    senderUserId: 'user_fan_sarah',
    senderUserName: 'Sarah_K',
    fulfillmentStatus: 'PENDING_SELLER_PACKAGING',
    physicalItemDescription: '100g Fresh Whole Bean Single-Origin Kyoto Roast',
    redemptionToken: 'TG-KYOTO-4491',
    shippingAddress: 'Studio Loft 3B, 240 Market St, San Francisco CA',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    dispatchId: 'dispatch_gift_initial_2',
    giftId: 'gift_mystery_bundle',
    giftName: 'Instant Mystery Bundle',
    giftPrice: 18.00,
    recipientCreatorId: 'merch_prime_1',
    recipientCreatorName: 'OrbitFlow Labs',
    senderUserId: 'user_supporter_kai',
    senderUserName: 'Kai_Tech',
    fulfillmentStatus: 'DISPATCHED_IN_TRANSIT',
    physicalItemDescription: 'Curated 3-Item Desk & Studio Lifestyle Mystery Pack',
    redemptionToken: 'TG-MYST-8812',
    shippingAddress: '450 Westlake Ave N, Seattle WA 98109',
    assignedTrackingNumber: 'SNDY-44189-EXP',
    dispatchedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  }
];

// Active Shipments Store for Multi-Tier Logistics API & 3-Way Digital Handshake
let activeShipments: ShipmentHandshake[] = [
  {
    shipmentId: 'shp_seed_101',
    orderId: 'ord_escrow_101',
    logisticsTier: 'HYPER_LOCAL',
    deliveryMethod: 'DOORSTEP',
    selectedProvider: 'prov_bolt_boda',
    trackingNumber: 'BOD-992144',
    sellerPickupPin: '4821',
    buyerDeliveryOtp: '749210',
    driver: MOCK_DRIVERS[0], // Juma Omondi (KME 489T)
    handshakeStep: 'PICKUP_VERIFIED_IN_TRANSIT',
    proofOfCondition: {
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      capturedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      verifiedByDriverId: 'drv_juma_boda',
      conditionStatus: 'SEALED_PRISTINE',
      notes: 'Sealed tamper-evident BizTok packaging verified pristine by rider upon pickup.',
      gpsCoordinates: { lat: -1.2825, lng: 36.8155 },
    },
    pickupVerifiedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    originAddress: 'OrbitFlow Labs Studio, Kilimani Road, Nairobi',
    destinationAddress: 'Nairobi Innovation Hub, Kilimani Road, Nairobi',
    currentCoordinates: { lat: -1.2842, lng: 36.8180 },
    targetCoordinates: { lat: -1.2921, lng: 36.8219 },
    progressPercent: 65,
    etaRemainingMinutes: 14,
    waybillNumber: 'WB-2025-BOD-10199',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    shipmentId: 'shp_seed_102',
    orderId: 'ord_escrow_102',
    logisticsTier: 'REGIONAL_SHUTTLE',
    deliveryMethod: 'PUDO_HUB',
    selectedProvider: 'prov_easycoach_parcel',
    trackingNumber: 'BUS-882104',
    sellerPickupPin: '3914',
    buyerDeliveryOtp: '518492',
    pudoHub: PUDO_HUBS[0], // TotalEnergies Westlands
    driver: MOCK_DRIVERS[1], // Faith Wambui (KDH 814X)
    handshakeStep: 'PICKUP_PIN_PENDING',
    originAddress: 'Komorebi Clayworks Studio, Workshop 4',
    destinationAddress: 'TotalEnergies Service Station (Westlands Hub), Waiyaki Way',
    currentCoordinates: { lat: -1.2662, lng: 36.8041 },
    targetCoordinates: { lat: -1.2662, lng: 36.8041 },
    progressPercent: 20,
    etaRemainingMinutes: 35,
    waybillNumber: 'WB-2025-BUS-20411',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    shipmentId: 'shp_seed_103',
    orderId: 'ord_escrow_103',
    logisticsTier: 'HYPER_LOCAL',
    deliveryMethod: 'DOORSTEP',
    selectedProvider: 'prov_uber_direct',
    trackingNumber: 'UBR-339182',
    sellerPickupPin: '7721',
    buyerDeliveryOtp: '901244',
    driver: MOCK_DRIVERS[0],
    handshakeStep: 'DELIVERED_PAYOUT_DISPATCHED',
    pickupVerifiedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    deliveryVerifiedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    originAddress: 'Atelier Indigo, Workshop 2',
    destinationAddress: 'Tech Tower, Upper Hill, Nairobi',
    currentCoordinates: { lat: -1.2980, lng: 36.8320 },
    targetCoordinates: { lat: -1.2980, lng: 36.8320 },
    progressPercent: 100,
    etaRemainingMinutes: 0,
    waybillNumber: 'WB-2025-UBR-99182',
    automatedPayout: {
      orderId: 'ord_escrow_103',
      merchantPayoutAmount: 175.75,
      merchantName: 'Atelier Indigo',
      riderDeliveryFee: 5.50,
      riderName: 'Juma Omondi',
      riderMpesaPhone: '+254 722 994 102',
      riderMpesaReceipt: 'MPESA_B2C_RIDER_994102',
      platformFee: 9.25,
      disbursedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: 'DISBURSED_SUCCESS',
    },
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  }
];

// Active Live Stream Session State
let activeLiveStream = {
  isLive: true,
  streamTitle: '⚡ LIVE FLASH SALE: Handcrafted Kyoto Ceramics & Fast MagSafe Docks',
  streamerName: 'OrbitFlow & Komorebi Studio',
  streamerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  viewerCount: 1420,
  likeCount: 28400,
  pinnedProduct: {
    id: 'prod_orbit_magsafe',
    title: 'OrbitFlow 3-in-1 Foldable MagSafe Dock',
    originalPrice: 69.00,
    flashPrice: 38.00,
    discountPercent: 45,
    expiresInSeconds: 540, // 9 min countdown
    thumbnailUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=400&q=80',
    stockRemaining: 18,
  },
  liveChat: [
    { id: '1', user: 'ken_tokyo', message: 'Just got the ceramic mug, absolutely stunning glaze! ✨', time: '1m ago', isVerifiedBuyer: true },
    { id: '2', user: 'amara_tech', message: 'Does the MagSafe stand work with iPhone 16 Pro Max without wobbling?', time: '30s ago', isVerifiedBuyer: false },
    { id: '3', user: 'elena_berlin', message: 'Sent a Coffee Bean Token gift! ☕ Enjoy the brew!', time: '15s ago', isVerifiedBuyer: true },
    { id: '4', user: 'david_sf', message: 'The flash deal price is insane, ordering right now 🛍️', time: 'Just now', isVerifiedBuyer: true },
  ]
};

/* ========================================================================== */
/* API ENDPOINTS                                                              */
/* ========================================================================== */

// 1. Merchant Onboarding & Verification Endpoint (Strict Gateway)
app.post('/api/merchants/verify-registration', (req, res) => {
  const payload: BusinessVerificationRequest = req.body;
  const result = verifyBusinessOnboarding(payload);

  if (!result.isValid) {
    res.status(422).json({
      error: 'VERIFICATION_FAILED',
      errorCode: result.errorCode,
      message: result.errorMessage,
    });
    return;
  }

  // Update active merchant session state
  currentMerchant = {
    merchantId: 'merch_prime_1',
    businessName: payload.businessName,
    isVerified: true,
    tier: currentMerchant.tier,
    idNumber: result.details?.formattedId || payload.idNumber,
    country: payload.country,
    verifiedAt: result.verifiedAt,
    createdAt: currentMerchant.createdAt,
  };

  res.json({
    success: true,
    merchant: currentMerchant,
    verification: result,
  });
});

// 2. Current Merchant Identity & Tier
app.get('/api/merchants/current', (req, res) => {
  res.json({
    merchant: currentMerchant,
    isVerified: currentMerchant.isVerified,
    tier: currentMerchant.tier,
  });
});

// Toggle verification state for demo convenience
app.post('/api/merchants/toggle-verification', (req, res) => {
  currentMerchant.isVerified = !currentMerchant.isVerified;
  res.json({
    success: true,
    isVerified: currentMerchant.isVerified,
    merchant: currentMerchant,
  });
});

// Toggle seller tier (Standard vs Premium)
app.post('/api/merchants/toggle-tier', (req, res) => {
  const check = enforceVerifiedMerchant(currentMerchant);
  if (!check.allowed) {
    res.status(check.status).json({ error: check.message });
    return;
  }

  currentMerchant.tier = currentMerchant.tier === 'PREMIUM' ? 'STANDARD' : 'PREMIUM';
  
  // Also reflect in product catalog for seller's products
  productCatalog = productCatalog.map(p => {
    if (p.sellerId === currentMerchant.merchantId) {
      return { ...p, sellerTier: currentMerchant.tier };
    }
    return p;
  });

  res.json({
    success: true,
    tier: currentMerchant.tier,
    boostMultiplier: currentMerchant.tier === 'PREMIUM' ? 1.35 : 1.0,
  });
});

// 3. Algorithmic Feed Ranking Endpoint
app.get('/api/feed/ranked', (req, res) => {
  const ranked = rankFeed(productCatalog, userProfile);
  res.json({
    items: ranked,
    userProfile,
  });
});

// 4. Record User Swipe Telemetry & Update Affinity
app.post('/api/feed/interaction', (req, res) => {
  const telemetry: UserInteractionTelemetry = req.body;
  userProfile = updateUserAffinity(userProfile, telemetry);

  // Recalculate feed rankings immediately
  const reRanked = rankFeed(productCatalog, userProfile);

  res.json({
    success: true,
    userProfile,
    newTopItem: reRanked[0],
    rankedItems: reRanked,
  });
});

// Reset user profile to neutral
app.post('/api/feed/reset-profile', (req, res) => {
  userProfile = createDefaultAffinityProfile('user_demo_1');
  const ranked = rankFeed(productCatalog, userProfile);
  res.json({
    success: true,
    userProfile,
    items: ranked,
  });
});

// 5. Add custom product to marketplace (from AI Ad Studio)
app.post('/api/feed/publish-product', (req, res) => {
  const check = enforceVerifiedMerchant(currentMerchant);
  if (!check.allowed) {
    res.status(check.status).json({ error: check.message });
    return;
  }

  const { title, price, category, description, tags, thumbnailUrl } = req.body;
  const newProduct: FeedProduct = {
    id: `prod_custom_${Date.now()}`,
    title: title || 'Custom BizTok Product',
    price: Number(price) || 45.0,
    originalPrice: Number(price) ? Number(price) * 1.25 : 60.0,
    category: category || 'lifestyle',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41530-large.mp4',
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    sellerId: currentMerchant.merchantId,
    sellerName: currentMerchant.businessName,
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    sellerTier: currentMerchant.tier,
    isSellerVerified: currentMerchant.isVerified,
    baseLikes: 140,
    baseShares: 28,
    historicalCtr: 0.15,
    avgWatchRatio: 0.80,
    publishedAt: new Date().toISOString(),
    tags: tags || ['biztokfinds', 'newrelease'],
    description: description || 'Newly launched verified product.',
    stockCount: 50,
  };

  productCatalog.unshift(newProduct);
  const ranked = rankFeed(productCatalog, userProfile);

  res.json({
    success: true,
    product: newProduct,
    rankedFeed: ranked,
  });
});

// 6. Multimodal Gemini AI Ad Generator Endpoint
app.post('/api/ads/generate-video-ad', async (req, res) => {
  // STRICT GATEWAY: Enforce verified merchant check
  const check = enforceVerifiedMerchant(currentMerchant);
  if (!check.allowed) {
    res.status(check.status).json({
      error: 'VERIFICATION_REQUIRED',
      message: 'Business Verification Required: You must verify your business entity identification number before generating AI ad campaigns.',
    });
    return;
  }

  const {
    product_name,
    product_category,
    key_selling_points,
    target_audience,
    tone,
    discount_offer,
    image_base64,
    mime_type,
  } = req.body;

  try {
    const contents: any[] = [];

    // Multimodal input: attach image if provided
    if (image_base64 && image_base64.length > 50) {
      const cleanBase64 = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
      contents.push({
        inlineData: {
          mimeType: mime_type || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
    You are an elite short-form mobile video marketing director and creative strategist for 'BizTok'.
    A verified merchant is launching an interactive video shopping campaign.

    Product Details:
    - Product Name: ${product_name || 'Artisanal Design Product'}
    - Category: ${product_category || 'lifestyle'}
    - Selling Points: ${key_selling_points || 'Handcrafted, premium materials, aesthetic ergonomics'}
    - Target Audience: ${target_audience || 'Modern online shoppers looking for quality'}
    - Tone: ${tone || 'High-Energy TikTok'}
    - Discount / Offer: ${discount_offer || '20% off launch exclusive'}

    Generate a high-converting, viral TikTok / Reels shopping video package.
    Return JSON adhering to this exact structure:
    {
      "viral_hook_headline": "Short punchy text overlay for seconds 0-2 (max 12 words)",
      "marketing_caption": "Engaging caption with call to action and emojis",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"],
      "fifteen_second_script": [
        {
          "timestamp_range": "00:00 - 00:03",
          "phase": "HOOK",
          "visual_direction": "Camera angle, action, B-roll cue, on-screen text",
          "spoken_audio": "Spoken line or voiceover",
          "sound_effect_cue": "Audio cue or sound effect"
        },
        {
          "timestamp_range": "00:03 - 00:07",
          "phase": "PROBLEM",
          "visual_direction": "Relatable frustration or lifestyle contrast",
          "spoken_audio": "Spoken line",
          "sound_effect_cue": "Audio cue"
        },
        {
          "timestamp_range": "00:07 - 00:12",
          "phase": "DEMO",
          "visual_direction": "Tactile product demo showing materials/speed/finish",
          "spoken_audio": "Spoken line",
          "sound_effect_cue": "Audio cue"
        },
        {
          "timestamp_range": "00:12 - 00:15",
          "phase": "CALL_TO_ACTION",
          "visual_direction": "Pointing down to yellow 'Tap to Buy' tag",
          "spoken_audio": "Urgent call to action mentioning discount",
          "sound_effect_cue": "Cash register or chime"
        }
      ],
      "recommended_audio_track_vibe": "Audio recommendation (e.g. Upbeat lo-fi hip hop, 128 BPM chill house)",
      "conversion_tips": [
        "Tactical tip 1",
        "Tactical tip 2",
        "Tactical tip 3"
      ]
    }
    `;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      ...parsed,
    });
  } catch (error: any) {
    console.error('Gemini Ad Generation Error:', error);

    // High quality deterministic fallback if API or rate limits encountered
    res.json({
      success: true,
      viral_hook_headline: `Why did nobody tell me about this ${product_name || 'setup'} earlier?!`,
      marketing_caption: `Stop scrolling if you care about quality. The ${product_name} just dropped on BizTok! 🔥 Use code LAUNCH20 to get ${discount_offer || '20% off'}. Tap the product tag below to claim yours before this batch sells out! 🛍️👇`,
      hashtags: ['#BizTokFinds', '#TikTokMadeMeBuyIt', '#AestheticSetup', '#MustHave', '#ShopSmall', '#CreatorFavs'],
      fifteen_second_script: [
        {
          timestamp_range: '00:00 - 00:03',
          phase: 'HOOK',
          visual_direction: 'Rapid snap zoom on product unboxing with bold neon text overlay',
          spoken_audio: 'If you want to upgrade your daily routine, pause your scroll right now.',
          sound_effect_cue: 'Bass drop / whoosh',
        },
        {
          timestamp_range: '00:03 - 00:07',
          phase: 'PROBLEM',
          visual_direction: 'Side-by-side comparison of cheap plastic alternative breaking vs this solid build',
          spoken_audio: 'I was so tired of fragile, clunky alternatives that feel cheap.',
          sound_effect_cue: 'Subtle record scratch',
        },
        {
          timestamp_range: '00:07 - 00:12',
          phase: 'DEMO',
          visual_direction: `Crisp macro 4K B-roll demonstrating ${key_selling_points || 'flawless ergonomics and premium materials'}`,
          spoken_audio: `Look at the precision finish. ${key_selling_points || 'It feels incredibly solid and works effortlessly.'}`,
          sound_effect_cue: 'Satisfying tactile ASMR snap',
        },
        {
          timestamp_range: '00:12 - 00:15',
          phase: 'CALL_TO_ACTION',
          visual_direction: 'Creator points down with finger to the yellow bottom product card tag',
          spoken_audio: `Tap the yellow shopping tag right down below before the ${discount_offer || 'launch deal'} ends!`,
          sound_effect_cue: 'Cash register bell',
        },
      ],
      recommended_audio_track_vibe: 'Trending 120 BPM upbeat electronic lofi with rhythmic bassline',
      conversion_tips: [
        'Place the physical product in frame within the first 0.8 seconds to capture swipe retention.',
        'Always point physically toward the bottom left where the interactive product drawer pill appears.',
        'Use high natural ambient lighting to emphasize surface textures and craftsmanship.',
      ],
    });
  }
});

/* ========================================================================== */
/* MODULE 1: SECURE IN-APP CHECKOUT & ESCROW GATEWAY                          */
/* ========================================================================== */

// Initiate regional mobile payment (M-Pesa STK Push)
app.post('/api/checkout/mpesa-push', (req, res) => {
  const { phoneNumber, amount, orderId, accountReference } = req.body;
  const result = initiateMPesaSTKPush({
    phoneNumber: phoneNumber || '0712345678',
    amount: Number(amount) || 49.0,
    orderId: orderId || `ord_${Date.now()}`,
    accountReference: accountReference || 'BizTokCheckout',
  });

  if (!result.isValidPhone) {
    res.status(400).json({ error: result.responseDescription });
    return;
  }

  res.json({
    success: true,
    ...result,
  });
});

// Create order with funds immediately locked in escrow
app.post('/api/checkout/create-order', (req, res) => {
  const {
    productId,
    productTitle,
    amount,
    buyerName,
    buyerPhone,
    sellerId,
    sellerName,
    paymentMethod,
    paymentReference,
    shippingAddress,
    deliveryMethod = 'DOORSTEP',
    logisticsTier = 'HYPER_LOCAL',
    selectedProvider = 'prov_bolt_boda',
    pudoId,
    deliveryFee = 3.80,
  } = req.body;

  const orderId = `ord_escrow_${Date.now()}`;
  const totalWithShipping = Number((Number(amount) || 49.0) + Number(deliveryFee)).toFixed(2);

  const newOrder = createEscrowOrder({
    orderId,
    productId: productId || 'prod_sample',
    productTitle: productTitle || 'BizTok Verified Product',
    amount: Number(totalWithShipping),
    buyerName: buyerName || 'Alex Kim',
    buyerPhone,
    sellerId: sellerId || currentMerchant.merchantId,
    sellerName: sellerName || currentMerchant.businessName,
    paymentMethod: paymentMethod || 'CARD',
    paymentReference: paymentReference || `REF_${Date.now()}`,
    shippingAddress: shippingAddress || '100 Silicon Way, Tech District, Nairobi',
  });

  escrowOrders.unshift(newOrder);

  // Automatically spawn the 3-Way Digital Handshake Shipment Record!
  const shipment = generateHandshakeCredentials({
    orderId,
    tier: logisticsTier as LogisticsTier,
    deliveryMethod: deliveryMethod as DeliveryMethod,
    providerId: selectedProvider,
    originAddress: `${currentMerchant.businessName} Flagship, Kilimani Studio`,
    destinationAddress: shippingAddress || '100 Silicon Way, Tech District, Nairobi',
    pudoId,
  });

  activeShipments.unshift(shipment);

  res.json({
    success: true,
    order: newOrder,
    shipment,
    message: 'Payment confirmed. Funds are securely locked in BizTok Escrow Vault. 3-Way Handshake shipment initialized.',
  });
});

// List all escrow orders
app.get('/api/escrow/orders', (req, res) => {
  res.json({
    orders: escrowOrders,
    totalEscrowLocked: escrowOrders.reduce((sum, o) => sum + (o.escrowHoldAmount || 0), 0),
    totalOrdersCount: escrowOrders.length,
  });
});

// Merchant attaches valid courier tracking ID -> moves to SHIPPED_TRACKING_GENERATED
app.post('/api/escrow/attach-tracking', (req, res) => {
  const { orderId, trackingNumber, carrier } = req.body;
  const orderIndex = escrowOrders.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const result = attachShippingTracking(escrowOrders[orderIndex], trackingNumber, carrier || 'FedEx');
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  escrowOrders[orderIndex] = result.updatedOrder;
  res.json({
    success: true,
    order: result.updatedOrder,
    message: result.message,
  });
});

// Delivery confirmation releases funds to merchant
app.post('/api/escrow/release', (req, res) => {
  const { orderId } = req.body;
  const orderIndex = escrowOrders.findIndex(o => o.orderId === orderId);

  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const result = releaseEscrowFunds(escrowOrders[orderIndex]);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  escrowOrders[orderIndex] = result.updatedOrder;
  res.json({
    success: true,
    order: result.updatedOrder,
    message: result.message,
  });
});

/* ========================================================================== */
/* MULTI-TIER LOGISTICS API INTEGRATED FRAMEWORK                              */
/* ========================================================================== */

// 1. Get PUDO Local Pickup Points
app.get('/api/logistics/pudo-hubs', (req, res) => {
  res.json({
    hubs: PUDO_HUBS,
  });
});

// 2. Get Available Logistics Providers across Tiers
app.get('/api/logistics/providers', (req, res) => {
  res.json({
    providers: LOGISTICS_PROVIDERS,
  });
});

// 3. Upfront Dynamic Smart-Pricing Engine
app.post('/api/logistics/quotes', (req, res) => {
  const {
    originAddress = `${currentMerchant.businessName} Flagship, Nairobi`,
    destinationAddress = 'Nairobi Innovation Hub, Kilimani Road, Nairobi',
    deliveryMethod = 'DOORSTEP',
    selectedPudoId,
    packageWeightKg = 1.2,
  } = req.body;

  const quotes = calculateLogisticsQuotes({
    originAddress,
    destinationAddress,
    deliveryMethod,
    selectedPudoId,
    packageWeightKg,
  });

  res.json({
    success: true,
    originAddress,
    destinationAddress,
    deliveryMethod,
    quotes,
  });
});

// 4. List Active Shipments with Handshake Statuses
app.get('/api/logistics/shipments', (req, res) => {
  res.json({
    shipments: activeShipments,
    totalActive: activeShipments.length,
    inTransitCount: activeShipments.filter(s => s.handshakeStep === 'PICKUP_VERIFIED_IN_TRANSIT').length,
    pendingPickupCount: activeShipments.filter(s => s.handshakeStep === 'PICKUP_PIN_PENDING').length,
    deliveredCount: activeShipments.filter(s => s.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED').length,
  });
});

// 5. Handshake Step 1: Seller Pickup PIN Verification & Condition Photo
app.post('/api/logistics/handshake/verify-pickup', (req, res) => {
  const { shipmentId, enteredPin, conditionNotes, photoUrl } = req.body;
  const idx = activeShipments.findIndex(s => s.shipmentId === shipmentId || s.orderId === shipmentId);

  if (idx === -1) {
    res.status(404).json({ error: 'Shipment not found' });
    return;
  }

  const result = verifySellerPickupHandshake({
    shipment: activeShipments[idx],
    enteredPin: String(enteredPin || ''),
    conditionNotes,
    photoUrl,
  });

  if (!result.success) {
    res.status(400).json({ error: result.message, errorCode: result.errorCode });
    return;
  }

  activeShipments[idx] = result.updatedShipment;

  // Sync escrow order status to SHIPPED_TRACKING_GENERATED
  const orderIdx = escrowOrders.findIndex(o => o.orderId === activeShipments[idx].orderId);
  if (orderIdx !== -1) {
    escrowOrders[orderIdx].escrowStatus = 'SHIPPED_TRACKING_GENERATED';
    escrowOrders[orderIdx].trackingNumber = activeShipments[idx].trackingNumber;
    escrowOrders[orderIdx].carrier = 'SendyExpress';
    escrowOrders[orderIdx].shippedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    shipment: result.updatedShipment,
    message: result.message,
  });
});

// 6. Handshake Step 2: Buyer Delivery OTP Verification & Automated Split Payout
app.post('/api/logistics/handshake/verify-delivery', (req, res) => {
  const { shipmentId, enteredOtp, deliveryFee } = req.body;
  const idx = activeShipments.findIndex(s => s.shipmentId === shipmentId || s.orderId === shipmentId);

  if (idx === -1) {
    res.status(404).json({ error: 'Shipment not found' });
    return;
  }

  const escrowOrder = escrowOrders.find(o => o.orderId === activeShipments[idx].orderId);

  const result = verifyBuyerDeliveryHandshake({
    shipment: activeShipments[idx],
    enteredOtp: String(enteredOtp || ''),
    escrowOrder,
    deliveryFee: Number(deliveryFee) || 4.50,
  });

  if (!result.success) {
    res.status(400).json({ error: result.message, errorCode: result.errorCode });
    return;
  }

  activeShipments[idx] = result.updatedShipment;

  // Release escrow funds to merchant
  if (escrowOrder) {
    const orderIdx = escrowOrders.findIndex(o => o.orderId === escrowOrder.orderId);
    if (orderIdx !== -1) {
      escrowOrders[orderIdx].escrowStatus = 'DELIVERED_ESCROW_RELEASED';
      escrowOrders[orderIdx].deliveredAt = new Date().toISOString();
      escrowOrders[orderIdx].releasedAt = new Date().toISOString();
      escrowOrders[orderIdx].escrowHoldAmount = 0;
    }
  }

  res.json({
    success: true,
    shipment: result.updatedShipment,
    payoutRecord: result.payoutRecord,
    message: result.message,
  });
});

// 7. Generate & View Legal Digital Waybill with Verified Merchant Permits
app.get('/api/logistics/waybill/:orderId', (req, res) => {
  const { orderId } = req.params;
  const shipment = activeShipments.find(s => s.orderId === orderId || s.shipmentId === orderId) || activeShipments[0];
  const escrowOrder = escrowOrders.find(o => o.orderId === shipment?.orderId);

  const waybill = generateLegalWaybill({
    merchant: currentMerchant,
    shipment: shipment || activeShipments[0],
    declaredItemTitle: escrowOrder ? escrowOrder.productTitle : 'BizTok Verified Showcase Merchandise',
    declaredValueUsd: escrowOrder ? escrowOrder.amount : 49.00,
    packageWeightKg: 1.4,
  });

  res.json({
    success: true,
    waybill,
  });
});

// 8. Simulate Rider GPS Step for live map movement
app.post('/api/logistics/simulate-step', (req, res) => {
  const { shipmentId } = req.body;
  const idx = activeShipments.findIndex(s => s.shipmentId === shipmentId || s.orderId === shipmentId);

  if (idx === -1) {
    res.status(404).json({ error: 'Shipment not found' });
    return;
  }

  const shipment = activeShipments[idx];
  const moved = simulateRiderMovement(shipment.currentCoordinates, shipment.targetCoordinates, 0.25);

  const newProgress = Math.min(95, shipment.progressPercent + 10);
  const newEta = Math.max(3, shipment.etaRemainingMinutes - 3);

  activeShipments[idx] = {
    ...shipment,
    currentCoordinates: { lat: moved.lat, lng: moved.lng },
    progressPercent: newProgress,
    etaRemainingMinutes: newEta,
    driver: {
      ...shipment.driver,
      currentLat: moved.lat,
      currentLng: moved.lng,
      speedKmh: Math.floor(28 + Math.random() * 20),
    },
  };

  res.json({
    success: true,
    shipment: activeShipments[idx],
    heading: moved.headingDegrees,
  });
});

/* ========================================================================== */
/* MODULE 2: PHYSICAL-REDEMPTION GIFTING SYSTEM ("TOKGIFTS")                  */
/* ========================================================================== */

// Return catalog of physical redeemable TokGifts
app.get('/api/gifts/catalog', (req, res) => {
  res.json({
    catalog: TOKGIFT_CATALOG,
  });
});

// Send a TokGift during broadcast -> automatically spawns physical dispatch order
app.post('/api/gifts/send', (req, res) => {
  const {
    giftId,
    recipientCreatorId,
    recipientCreatorName,
    senderUserId,
    senderUserName,
    shippingAddress,
  } = req.body;

  const result = sendTokGift({
    giftId: giftId || 'gift_coffee_bean',
    recipientCreatorId: recipientCreatorId || currentMerchant.merchantId,
    recipientCreatorName: recipientCreatorName || currentMerchant.businessName,
    senderUserId: senderUserId || 'user_guest',
    senderUserName: senderUserName || 'BizTok_Fan',
    shippingAddress,
  });

  if (!result.success || !result.dispatchRecord) {
    res.status(400).json({ error: result.error || 'Failed to dispatch gift' });
    return;
  }

  giftDispatchQueue.unshift(result.dispatchRecord);

  // Also broadcast into active live chat if stream is active
  activeLiveStream.liveChat.unshift({
    id: `chat_gift_${Date.now()}`,
    user: result.dispatchRecord.senderUserName,
    message: `🎁 Sent ${result.giftItem?.icon} ${result.giftItem?.name} ($${result.giftItem?.price.toFixed(2)})! Physical item queued for dispatch.`,
    time: 'Just now',
    isVerifiedBuyer: true,
  });

  res.json({
    success: true,
    gift: result.giftItem,
    dispatchRecord: result.dispatchRecord,
    message: `🎉 Sent ${result.giftItem?.name}! Physical redemption order #${result.dispatchRecord.redemptionToken} dispatched to seller.`,
  });
});

// List physical gift dispatch queue for merchant fulfillment
app.get('/api/gifts/dispatch-queue', (req, res) => {
  res.json({
    queue: giftDispatchQueue,
    pendingCount: giftDispatchQueue.filter(g => g.fulfillmentStatus === 'PENDING_SELLER_PACKAGING').length,
  });
});

// Merchant fulfills physical gift dispatch by attaching courier tracking
app.post('/api/gifts/dispatch-ship', (req, res) => {
  const { dispatchId, trackingNumber } = req.body;
  const idx = giftDispatchQueue.findIndex(g => g.dispatchId === dispatchId);

  if (idx === -1) {
    res.status(404).json({ error: 'Gift dispatch record not found' });
    return;
  }

  const updated = dispatchPhysicalGift(giftDispatchQueue[idx], trackingNumber || 'TRK-GIFT-9918');
  giftDispatchQueue[idx] = updated;

  res.json({
    success: true,
    dispatchRecord: updated,
    message: `Gift shipment fulfilled with tracking: ${updated.assignedTrackingNumber}`,
  });
});

/* ========================================================================== */
/* MODULE 3: SHOPPING AI ASSISTANT ('BIZZY') POWERED BY GEMINI                */
/* ========================================================================== */

app.post('/api/ai/bizzy', async (req, res) => {
  const { mode, query, currentProduct, userQuestion } = req.body;
  const effectiveQuery = userQuestion || query || 'Tell me about this product and why I should buy it.';

  try {
    const isBuyer = mode !== 'SELLER';

    const systemInstruction = isBuyer
      ? `You are 'Bizzy', an ultra-smart, stylish AI shopping concierge for BizTok.
         You assist buyers watching live video shopping feeds.
         Current product details:
         - Title: ${currentProduct?.title || 'OrbitFlow 3-in-1 Foldable MagSafe Dock'}
         - Price: $${currentProduct?.price || 49}
         - Category: ${currentProduct?.category || 'tech'}
         - Description: ${currentProduct?.description || 'Aircraft aluminum fast wireless charging dock'}
         - Tags: ${(currentProduct?.tags || []).join(', ')}

         Provide concise, helpful, friendly advice (under 90 words).
         Answer sizing, technical compatibility, materials, comparison with other items, and warranty questions.
         Always include 1 punchy reason to buy and recommend checking out via the in-app Escrow Vault.`
      : `You are 'Bizzy Seller Co-Pilot', an expert live-streaming sales strategist for BizTok merchants.
         The seller is broadcasting live and needs instant advice.
         Current broadcast product:
         - Title: ${currentProduct?.title || 'OrbitFlow 3-in-1 Foldable MagSafe Dock'}
         - Price: $${currentProduct?.price || 49}

         Provide real-time pricing benchmarks, live objection-handling soundbites (under 80 words),
         and suggestions for flash-deal urgency to drive chat conversions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nUser Question: ${effectiveQuery}` }],
        },
      ],
      config: {
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm Bizzy! This product is crafted with premium materials and backed by BizTok Escrow. Tap Buy to secure yours!";

    res.json({
      success: true,
      mode: isBuyer ? 'BUYER' : 'SELLER',
      reply,
      suggestedQuestions: isBuyer
        ? [
            'How does this compare to standard plastic docks?',
            'What is the return & escrow policy?',
            'Can I gift this with physical delivery?',
          ]
        : [
            'Give me a 10-second flash sale pitch',
            'How do I handle shipping time objections?',
            'Recommend a limited-edition bundle price',
          ],
    });
  } catch (error) {
    console.error('Bizzy AI error:', error);
    // Fallback if API key limits
    res.json({
      success: true,
      mode: mode || 'BUYER',
      reply:
        mode === 'SELLER'
          ? "Bizzy Tip: Announce a 5-minute flash deal countdown! Highlight the CNC aircraft-grade aluminum build and emphasize that orders are backed by BizTok Escrow protection."
          : `Bizzy here! The ${currentProduct?.title || 'OrbitFlow MagSafe Dock'} features genuine premium craftsmanship with 15W Qi2 fast charging and an anodized thermal-cooling hinge. It's fully covered by BizTok 100% Escrow Protection!`,
      suggestedQuestions: [
        'How does escrow protection work?',
        'Does it include fast air courier shipping?',
      ],
    });
  }
});

/* ========================================================================== */
/* MODULE 4: SELLER LIVE-STREAMING & MARKETING SUITE (CLIP-TO-AD)             */
/* ========================================================================== */

// Live broadcast state & pinned product
app.get('/api/livestream/state', (req, res) => {
  res.json({
    liveStream: activeLiveStream,
  });
});

// Update or pin a flash-deal product during broadcast
app.post('/api/livestream/pin-product', (req, res) => {
  const { productId, flashPrice, expiresInSeconds } = req.body;
  const prod = productCatalog.find(p => p.id === productId) || productCatalog[0];

  const priceNum = Number(flashPrice) || Math.round(prod.price * 0.75);
  const discountPercent = Math.round(((prod.price - priceNum) / prod.price) * 100);

  activeLiveStream.pinnedProduct = {
    id: prod.id,
    title: prod.title,
    originalPrice: prod.price,
    flashPrice: priceNum,
    discountPercent: discountPercent > 0 ? discountPercent : 35,
    expiresInSeconds: Number(expiresInSeconds) || 480,
    thumbnailUrl: prod.thumbnailUrl,
    stockRemaining: Math.floor(Math.random() * 15 + 5),
  };

  res.json({
    success: true,
    pinnedProduct: activeLiveStream.pinnedProduct,
    message: `⚡ Flash Deal Pinned: ${prod.title} at $${priceNum} (${discountPercent}% OFF)!`,
  });
});

// Automated Clip-to-Ad: Converts live broadcast moments into an Ad Studio package via Gemini
app.post('/api/livestream/clip-to-ad', async (req, res) => {
  const { streamSnippet, productTitle, highlightTimestamp } = req.body;

  try {
    const prompt = `
    You are BizTok's automated Live Clip-to-Ad AI Engine.
    A live streamer just finished a viral broadcast snippet:
    - Highlight: "${streamSnippet || 'Demonstrating the magnetic snap and how it holds phone at 60 degree video call angle'}"
    - Product: "${productTitle || 'OrbitFlow 3-in-1 Foldable MagSafe Dock'}"
    - Timestamp: "${highlightTimestamp || '00:14:22 - 00:14:37'}"

    Transform this live moment into a high-converting 15-second TikTok/Reels ad script.
    Return strict JSON adhering to:
    {
      "viral_hook_headline": "Punchy 0-2s hook text overlay",
      "marketing_caption": "Energetic live-highlight caption with emojis",
      "hashtags": ["#LiveFinds", "#TikTokShop", "#BizTokLive", "#FlashDeal", "#MustHave"],
      "fifteen_second_script": [
        { "timestamp_range": "00:00 - 00:03", "phase": "HOOK", "visual_direction": "Live stream clip replay with flash border", "spoken_audio": "Line 1" },
        { "timestamp_range": "00:03 - 00:07", "phase": "PROBLEM", "visual_direction": "Creator reacting live to chat comment", "spoken_audio": "Line 2" },
        { "timestamp_range": "00:07 - 00:12", "phase": "DEMO", "visual_direction": "Tactile close-up demonstration from live stream", "spoken_audio": "Line 3" },
        { "timestamp_range": "00:12 - 00:15", "phase": "CALL_TO_ACTION", "visual_direction": "Pulsing red arrow pointing to pinned flash deal button", "spoken_audio": "Line 4" }
      ],
      "recommended_audio_track_vibe": "High energy EDM live house beat"
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      ...parsed,
      sourceSnippet: streamSnippet,
      sourceTimestamp: highlightTimestamp,
    });
  } catch (error) {
    console.error('Clip-to-Ad Error:', error);
    res.json({
      success: true,
      viral_hook_headline: `They couldn't believe this happened live on stream! 😱`,
      marketing_caption: `Catching the live demo moment of ${productTitle || 'OrbitFlow Dock'}. 🔥 Limited flash stock remaining from today's broadcast! Tap below to secure your escrow order! 🛍️`,
      hashtags: ['#BizTokLive', '#LiveHighlight', '#TikTokShop', '#FlashSale', '#ViralDesk'],
      fifteen_second_script: [
        {
          timestamp_range: '00:00 - 00:03',
          phase: 'HOOK',
          visual_direction: 'Fast-forward clip of live broadcast with pulsating neon red LIVE badge',
          spoken_audio: 'The chat literally erupted when we tested this live on stream!',
        },
        {
          timestamp_range: '00:03 - 00:07',
          phase: 'PROBLEM',
          visual_direction: 'Highlighting viewer comment on screen questioning build quality',
          spoken_audio: 'Someone in chat asked: is it actually solid aluminum or cheap coated plastic?',
        },
        {
          timestamp_range: '00:07 - 00:12',
          phase: 'DEMO',
          visual_direction: 'Streamer taps the dock on camera with crisp tactile metallic chime',
          spoken_audio: 'Listen to that solid resonance. CNC machined from a solid block of aircraft alloy.',
        },
        {
          timestamp_range: '00:12 - 00:15',
          phase: 'CALL_TO_ACTION',
          visual_direction: 'Screen zooms on the glowing yellow Buy tag at the bottom',
          spoken_audio: 'Grab the stream flash deal before midnight before the rest sell out!',
        },
      ],
      recommended_audio_track_vibe: '128 BPM pumping festival electro with live crowd applause',
    });
  }
});

// 7. Codebase Files Explorer Endpoint (Allows viewing Python/FastAPI & React Native code)
app.get('/api/codebase/files', (req, res) => {
  const basePath = __dirname;
  
  function getSafeFile(relativePath: string) {
    try {
      const fullPath = path.join(basePath, relativePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
    } catch {
      return null;
    }
    return null;
  }

  const files = {
    'backend_fastapi/main.py': getSafeFile('backend_fastapi/main.py'),
    'backend_fastapi/middleware/merchant_verification.py': getSafeFile('backend_fastapi/middleware/merchant_verification.py'),
    'backend_fastapi/services/recommendation.py': getSafeFile('backend_fastapi/services/recommendation.py'),
    'backend_fastapi/services/gemini_ad_generator.py': getSafeFile('backend_fastapi/services/gemini_ad_generator.py'),
    'backend_fastapi/routers/merchants.py': getSafeFile('backend_fastapi/routers/merchants.py'),
    'backend_fastapi/routers/feed.py': getSafeFile('backend_fastapi/routers/feed.py'),
    'backend_fastapi/routers/ads.py': getSafeFile('backend_fastapi/routers/ads.py'),
    'backend_fastapi/schemas/merchant.py': getSafeFile('backend_fastapi/schemas/merchant.py'),
    'backend_fastapi/schemas/feed.py': getSafeFile('backend_fastapi/schemas/feed.py'),
    'backend_fastapi/schemas/ad.py': getSafeFile('backend_fastapi/schemas/ad.py'),
    'backend_fastapi/requirements.txt': getSafeFile('backend_fastapi/requirements.txt'),
    'mobile_expo/App.tsx': getSafeFile('mobile_expo/App.tsx'),
    'mobile_expo/screens/FeedScreen.tsx': getSafeFile('mobile_expo/screens/FeedScreen.tsx'),
    'mobile_expo/screens/MerchantOnboardingScreen.tsx': getSafeFile('mobile_expo/screens/MerchantOnboardingScreen.tsx'),
    'mobile_expo/screens/AdStudioScreen.tsx': getSafeFile('mobile_expo/screens/AdStudioScreen.tsx'),
    'mobile_expo/components/VideoFeedItem.tsx': getSafeFile('mobile_expo/components/VideoFeedItem.tsx'),
    'mobile_expo/components/ProductDrawer.tsx': getSafeFile('mobile_expo/components/ProductDrawer.tsx'),
    'mobile_expo/components/AlgorithmScorePill.tsx': getSafeFile('mobile_expo/components/AlgorithmScorePill.tsx'),
    'mobile_expo/hooks/useFeedAlgorithm.ts': getSafeFile('mobile_expo/hooks/useFeedAlgorithm.ts'),
    'mobile_expo/package.json': getSafeFile('mobile_expo/package.json'),
  };

  res.json(files);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

/* ========================================================================== */
/* VITE MIDDLEWARE OR STATIC SERVING                                          */
/* ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BizTok Full-Stack Engine] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
