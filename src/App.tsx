/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Radio,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  Code2,
  Sliders,
  Smartphone,
  Maximize2,
  RefreshCw,
  ShoppingBag,
  Zap,
  TrendingUp,
  Store,
  ChevronRight,
  Flame,
  Lock,
  Gift,
  Bot,
  Truck,
  Package
} from 'lucide-react';
import { FeedSimulator } from './components/FeedSimulator';
import { AlgorithmInspector } from './components/AlgorithmInspector';
import { MerchantGate } from './components/MerchantGate';
import { AdStudio } from './components/AdStudio';
import { CodeExplorer } from './components/CodeExplorer';
import { CheckoutEscrowDrawer } from './components/CheckoutEscrowDrawer';
import { EscrowDashboardModal } from './components/EscrowDashboardModal';
import { TokGiftDrawer } from './components/TokGiftDrawer';
import { BizzyAssistant } from './components/BizzyAssistant';
import { LiveStreamSuite } from './components/LiveStreamSuite';
import {
  RankedFeedItem,
  UserAffinityProfile,
  UserInteractionTelemetry,
  ProductCategory,
  FeedProduct
} from './lib/recommendationEngine';
import { MerchantAccount } from './lib/businessVerification';
import { TokGiftItem, PhysicalGiftDispatchRecord } from './lib/tokGifts';

type ActiveViewTab = 'feed' | 'live' | 'studio' | 'merchant' | 'code';
type LayoutMode = 'mobile' | 'dual';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('feed');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('dual');
  const [rankedItems, setRankedItems] = useState<RankedFeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<UserAffinityProfile | null>(null);
  const [merchant, setMerchant] = useState<MerchantAccount>({
    merchantId: 'merch_prime_1',
    businessName: 'Nordic Clayworks & Design Inc',
    isVerified: true, // Default verified for smooth exploration, can toggle
    tier: 'PREMIUM',
    idNumber: '12-3456789 (US EIN)',
    country: 'US',
    createdAt: new Date().toISOString(),
  });

  // Modal / Drawer states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<FeedProduct | null>(null);
  const [isEscrowDashboardOpen, setIsEscrowDashboardOpen] = useState(false);
  const [isTokGiftsOpen, setIsTokGiftsOpen] = useState(false);
  const [isBizzyOpen, setIsBizzyOpen] = useState(false);
  const [bizzyMode, setBizzyMode] = useState<'BUYER' | 'SELLER'>('BUYER');

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial feed & merchant profile
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/feed/ranked');
      const data = await res.json();
      if (data.items) {
        setRankedItems(data.items);
        setUserProfile(data.userProfile);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await fetch('/api/merchants/current');
      const data = await res.json();
      if (data.merchant) {
        setMerchant(data.merchant);
      }
    } catch (err) {
      console.error('Failed to load merchant:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    fetchMerchant();
  }, [fetchFeed, fetchMerchant]);

  // Handle user interaction telemetry
  const handleInteraction = async (telemetry: UserInteractionTelemetry) => {
    try {
      const res = await fetch('/api/feed/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry),
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.userProfile);
        setRankedItems(data.rankedItems);

        if (telemetry.action === 'LIKE') {
          showToast(`Affinity +20% for #${telemetry.category}`);
        } else if (telemetry.action === 'OPEN_DRAWER') {
          showToast(`Intent high: Affinity +30% for #${telemetry.category}`);
        } else if (telemetry.action === 'BUY') {
          showToast(`🎉 Order Placed! Affinity +45% for #${telemetry.category}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle manual micro-behavior simulation from inspector
  const handleTriggerSimulation = async (
    category: ProductCategory,
    action: 'SKIP_FAST' | 'WATCH_COMPLETE' | 'BUY'
  ) => {
    const currentItem = rankedItems[currentIndex] || rankedItems[0];
    await handleInteraction({
      productId: currentItem?.product.id || 'prod_sample',
      category,
      watchTimeSeconds: action === 'SKIP_FAST' ? 1.0 : 15.0,
      videoDurationSeconds: 15.0,
      action,
    });
  };

  // Reset user profile vector
  const handleResetProfile = async () => {
    try {
      const res = await fetch('/api/feed/reset-profile', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUserProfile(data.userProfile);
        setRankedItems(data.items);
        showToast('User category affinity vector reset to baseline 0.50');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle merchant tier (Standard vs Premium)
  const handleToggleTier = async () => {
    try {
      const res = await fetch('/api/merchants/toggle-tier', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMerchant(m => ({ ...m, tier: data.tier }));
        fetchFeed();
        showToast(`Seller Tier switched to ${data.tier} (${data.tier === 'PREMIUM' ? '+35% Boost' : '1.0x'})`);
      } else {
        showToast(data.error || 'Verification required');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle verification state for testing
  const handleToggleVerifyState = async () => {
    try {
      const res = await fetch('/api/merchants/toggle-verification', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMerchant(data.merchant);
        fetchFeed();
        showToast(`Merchant is now ${data.isVerified ? 'VERIFIED' : 'UNVERIFIED (Gated)'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Publish newly generated AI Ad to live marketplace
  const handlePublishToFeed = async (productData: any) => {
    try {
      const res = await fetch('/api/feed/publish-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (data.success) {
        setRankedItems(data.rankedFeed);
        setCurrentIndex(0);
        setActiveTab('feed');
        showToast('🚀 Newly generated AI video product published to live feed!');
      } else {
        showToast(data.error || 'Publish failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Checkout order placement success
  const handleOrderSuccess = (order: any) => {
    setIsCheckoutOpen(false);
    showToast(`🔒 Order #${order.orderId.slice(-6)} placed! Funds locked in BizTok Escrow Vault.`);
    // Trigger positive recommendation affinity reward
    if (checkoutProduct) {
      handleInteraction({
        productId: checkoutProduct.id,
        category: checkoutProduct.category,
        watchTimeSeconds: 15,
        videoDurationSeconds: 15,
        action: 'BUY',
      });
    }
  };

  // TokGift sent callback
  const handleGiftSent = (gift: TokGiftItem, record: PhysicalGiftDispatchRecord) => {
    setIsTokGiftsOpen(false);
    showToast(`🎁 Sent ${gift.icon} ${gift.name}! Physical item queued in seller dispatch.`);
  };

  const currentItem = rankedItems[currentIndex] || rankedItems[0];
  const activeProduct = currentItem?.product;

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-zinc-900 to-black border border-cyan-500/60 shadow-2xl shadow-cyan-500/20 text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#070709]/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/20">
            <Flame className="w-5 h-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                BizTok
                <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                  PRO
                </span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] text-zinc-400 font-medium border-l border-zinc-800 pl-2">
                Video-First Social Marketplace
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner overflow-x-auto max-w-[60vw]">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="flex items-center gap-1">
              Live Broadcast
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            </span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Ad Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('merchant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'merchant'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Business</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Code Hub</span>
          </button>
        </nav>

        {/* Right Status Rail: Escrow Vault & Merchant Tier Badges */}
        <div className="flex items-center gap-2">
          {/* Escrow Vault Button */}
          <button
            onClick={() => setIsEscrowDashboardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 transition shadow-sm shadow-emerald-500/20"
            title="Inspect Escrow Vault & Tracking Manager"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Escrow Vault</span>
          </button>

          {/* Glowing Verified Badge */}
          <button
            onClick={() => setActiveTab('merchant')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
              merchant.isVerified
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-red-950/60 text-red-300 border-red-500/40'
            }`}
            title="Click to manage business identification verification"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${merchant.isVerified ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className="hidden lg:inline">{merchant.isVerified ? 'Verified Biz' : 'Unverified'}</span>
          </button>

          {/* Glowing Premium Tier Boost Pill */}
          <button
            onClick={handleToggleTier}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
              merchant.tier === 'PREMIUM'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            title="Click to toggle +35% Algorithmic Recommendation Multiplier"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">
              {merchant.tier === 'PREMIUM' ? '+35% Boost' : 'Standard'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* VIEW 1: Video Shopping Feed */}
        {activeTab === 'feed' && (
          <div className="flex flex-col gap-6">
            {/* View Mode Bar for Feed */}
            <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="font-bold text-white">Algorithmic Shopping Feed:</span>
                <span className="hidden sm:inline">Prioritizing by user swipe dwell time, category affinities & premium tier</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEscrowDashboardOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Escrow Orders</span>
                </button>

                <button
                  onClick={() => setLayoutMode(m => (m === 'dual' ? 'mobile' : 'dual'))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                >
                  {layoutMode === 'dual' ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Phone Focus</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Split Inspector</span>
                    </>
                  )}
                </button>

                <button
                  onClick={fetchFeed}
                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300"
                  title="Refresh & Re-rank Feed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center">
              {/* Phone Frame Simulator */}
              <div className={layoutMode === 'dual' ? 'lg:col-span-5 flex justify-center' : 'col-span-12 flex justify-center'}>
                <FeedSimulator
                  rankedItems={rankedItems}
                  currentIndex={currentIndex}
                  onNavigate={setCurrentIndex}
                  onInteraction={handleInteraction}
                  onOpenInspector={() => setIsInspectorOpen(o => !o)}
                  isInspectorOpen={isInspectorOpen}
                  onOpenCheckoutModal={prod => {
                    setCheckoutProduct(prod);
                    setIsCheckoutOpen(true);
                  }}
                  onOpenTokGifts={() => setIsTokGiftsOpen(true)}
                  onOpenBizzy={() => {
                    setBizzyMode('BUYER');
                    setIsBizzyOpen(true);
                  }}
                />
              </div>

              {/* Live Algorithm Math & Affinity Inspector (Split View) */}
              {layoutMode === 'dual' && (
                <div className="lg:col-span-7 flex flex-col gap-5">
                  {userProfile && (
                    <AlgorithmInspector
                      userProfile={userProfile}
                      currentRankedItem={rankedItems[currentIndex]}
                      rankedFeed={rankedItems}
                      onTriggerSimulation={handleTriggerSimulation}
                      onResetProfile={handleResetProfile}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Seller Live-Streaming & Marketing Suite ('Live Go' Mode) */}
        {activeTab === 'live' && (
          <LiveStreamSuite
            products={rankedItems.map(r => r.product)}
            onOpenCheckout={prod => {
              setCheckoutProduct(prod);
              setIsCheckoutOpen(true);
            }}
            onOpenGifts={() => setIsTokGiftsOpen(true)}
            onClipToAdGenerated={adPkg => {
              setActiveTab('studio');
              showToast('🎬 Live stream clip converted to Ad Studio package!');
            }}
            isMerchantVerified={merchant.isVerified}
          />
        )}

        {/* VIEW 3: Multimodal Gemini AI Ad Studio */}
        {activeTab === 'studio' && (
          <AdStudio
            merchant={merchant}
            onNavigateToVerify={() => setActiveTab('merchant')}
            onPublishToFeed={handlePublishToFeed}
          />
        )}

        {/* VIEW 4: Verified Business Onboarding Gate */}
        {activeTab === 'merchant' && (
          <div className="max-w-4xl mx-auto w-full">
            <MerchantGate
              merchant={merchant}
              onVerifySuccess={updated => {
                setMerchant(updated);
                showToast('✅ Business identity verified successfully! Features unlocked.');
              }}
              onToggleTier={handleToggleTier}
              onToggleVerifyState={handleToggleVerifyState}
            />
          </div>
        )}

        {/* VIEW 5: Full-Stack Code Hub (FastAPI + React Native / Expo Architecture) */}
        {activeTab === 'code' && <CodeExplorer />}
      </main>

      {/* Floating Bizzy AI Launcher Button */}
      <button
        onClick={() => {
          setBizzyMode('BUYER');
          setIsBizzyOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 text-black p-3.5 rounded-full shadow-2xl shadow-cyan-500/30 ring-2 ring-white/20 hover:scale-110 active:scale-95 transition flex items-center gap-2 group"
        title="Open Bizzy AI Shopping Concierge"
      >
        <Bot className="w-5 h-5 text-black" />
        <span className="text-xs font-black pr-1 hidden sm:inline text-black">Ask Bizzy AI</span>
      </button>

      {/* MODAL 1: In-App Checkout & Escrow Gateway */}
      {isCheckoutOpen && checkoutProduct && (
        <CheckoutEscrowDrawer
          product={checkoutProduct}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* MODAL 2: Escrow Dashboard & Courier Tracking Manager */}
      {isEscrowDashboardOpen && (
        <EscrowDashboardModal
          onClose={() => setIsEscrowDashboardOpen(false)}
          onOrderUpdated={() => fetchFeed()}
        />
      )}

      {/* MODAL 3: TokGifts Physical Redemption Gifting Drawer */}
      {isTokGiftsOpen && (
        <TokGiftDrawer
          creatorName={activeProduct?.sellerName || merchant.businessName}
          creatorId={activeProduct?.sellerId || merchant.merchantId}
          onClose={() => setIsTokGiftsOpen(false)}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* MODAL 4: Bizzy AI Shopping Assistant Drawer */}
      <BizzyAssistant
        currentProduct={activeProduct}
        isOpen={isBizzyOpen}
        onClose={() => setIsBizzyOpen(false)}
        onOpenCheckout={prod => {
          setCheckoutProduct(prod);
          setIsCheckoutOpen(true);
        }}
        initialMode={bizzyMode}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#070709] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-400">BizTok PRO Architecture</span>
          <span>•</span>
          <span>FastAPI Backend + React Native / Expo Frontend + Gemini 3.8 Flash Multimodal Ad Engine</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>Escrow Vault Active</span>
          <span>•</span>
          <span>M-Pesa STK Gateway</span>
          <span>•</span>
          <span>Physical TokGifts System</span>
        </div>
      </footer>
    </div>
  );
}
