/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  ShoppingBag,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  X,
  Truck,
  RotateCcw,
  Zap,
  Info,
  Gift,
  Bot
} from 'lucide-react';
import { FeedProduct, RankedFeedItem, UserInteractionTelemetry } from '../lib/recommendationEngine';
import { CommentsModal } from './CommentsModal';
import { ShareModal } from './ShareModal';

interface FeedSimulatorProps {
  rankedItems: RankedFeedItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  onInteraction: (telemetry: UserInteractionTelemetry) => void;
  onOpenInspector: () => void;
  isInspectorOpen: boolean;
  onOpenCheckoutModal?: (product: FeedProduct) => void;
  onOpenTokGifts?: (product: FeedProduct) => void;
  onOpenBizzy?: (product: FeedProduct) => void;
}

export function FeedSimulator({
  rankedItems,
  currentIndex,
  onNavigate,
  onInteraction,
  onOpenInspector,
  isInspectorOpen,
  onOpenCheckoutModal,
  onOpenTokGifts,
  onOpenBizzy,
}: FeedSimulatorProps) {
  const currentItem = rankedItems[currentIndex] || rankedItems[0];
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(currentItem?.product.baseLikes || 1200);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);

  const watchTimerRef = useRef<number | null>(null);

  // Sync likes and timer when item changes
  useEffect(() => {
    if (!currentItem) return;
    setIsLiked(false);
    setLikeCount(currentItem.product.baseLikes);
    setWatchSeconds(0);
    setIsDrawerOpen(false);
    setIsPurchased(false);

    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    watchTimerRef.current = window.setInterval(() => {
      setWatchSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [currentIndex, currentItem]);

  // Handle swipe or navigation
  const handleNext = () => {
    if (!currentItem) return;
    // Record telemetry
    const action = watchSeconds < 2 ? 'SKIP_FAST' : watchSeconds > 8 ? 'WATCH_COMPLETE' : 'WATCH_PARTIAL';
    onInteraction({
      productId: currentItem.product.id,
      category: currentItem.product.category,
      watchTimeSeconds: watchSeconds,
      videoDurationSeconds: 15,
      action,
    });

    if (currentIndex < rankedItems.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // loop
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleLike = () => {
    if (!currentItem) return;
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount(c => (nextState ? c + 1 : c - 1));

    if (nextState) {
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      onInteraction({
        productId: currentItem.product.id,
        category: currentItem.product.category,
        watchTimeSeconds: watchSeconds,
        videoDurationSeconds: 15,
        action: 'LIKE',
      });
    }
  };

  const handleOpenDrawer = () => {
    if (!currentItem) return;
    setIsDrawerOpen(true);
    onInteraction({
      productId: currentItem.product.id,
      category: currentItem.product.category,
      watchTimeSeconds: watchSeconds,
      videoDurationSeconds: 15,
      action: 'OPEN_DRAWER',
    });
  };

  const handleInstantBuy = () => {
    if (!currentItem) return;
    setIsPurchased(true);
    onInteraction({
      productId: currentItem.product.id,
      category: currentItem.product.category,
      watchTimeSeconds: 15,
      videoDurationSeconds: 15,
      action: 'BUY',
    });
    setTimeout(() => {
      setIsPurchased(false);
      setIsDrawerOpen(false);
    }, 1500);
  };

  if (!currentItem) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        No products available in marketplace.
      </div>
    );
  }

  const { product, scoreBreakdown } = currentItem;

  return (
    <div className="relative w-full h-[690px] max-w-[360px] mx-auto rounded-[38px] overflow-hidden bg-black shadow-2xl border-4 border-zinc-800 flex flex-col select-none">
      {/* iPhone Dynamic Island Mockup */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
      </div>

      {/* Video Background / Media Surface */}
      <div className="relative flex-1 w-full h-full overflow-hidden" onDoubleClick={handleLike}>
        <img
          src={product.thumbnailUrl}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out scale-105"
        />

        {/* Ambient Dark Gradient for readable overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

        {/* Double-tap Heart Burst Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 opacity-90" />
          </div>
        )}

        {/* Top Controls: Algorithm Score Pill & Audio Toggle */}
        <div className="absolute top-10 left-3 right-3 flex items-center justify-between z-30">
          <button
            onClick={onOpenInspector}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
              isInspectorOpen
                ? 'bg-cyan-500 text-black ring-2 ring-cyan-300'
                : 'bg-black/60 text-white hover:bg-black/80 border border-white/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rank Score: {scoreBreakdown.finalScore.toFixed(3)}</span>
            {product.sellerTier === 'PREMIUM' && (
              <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                +35% Boost
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMuted(m => !m)}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/80 transition"
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-300" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Feed Vertical Navigation Arrows (Floating on side) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 flex flex-col gap-2 z-30">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/80 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Previous Video"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/80 transition animate-bounce"
            title="Next Video (Swipe down)"
          >
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Right Action Rail (Likes, Comments, Gifts, Bizzy AI, Share, Shop) */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-2.5 z-30">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center group">
            <div
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 shadow-md ${
                isLiked ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-black/50 text-white border border-white/15'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </div>
            <span className="text-[10px] font-semibold text-white drop-shadow mt-0.5">
              {likeCount.toLocaleString()}
            </span>
          </button>

          {/* Comment */}
          <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/15 shadow-md hover:bg-black/70 transition">
              <MessageCircle className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="text-[10px] font-semibold text-white drop-shadow mt-0.5">342</span>
          </button>

          {/* TokGifts: Physical Redemption Gifting */}
          <button
            onClick={() => {
              if (onOpenTokGifts) onOpenTokGifts(product);
            }}
            className="flex flex-col items-center group"
            title="Send TokGift (Physical Dispatch)"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 backdrop-blur-md flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-105 transition">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-pink-400 drop-shadow mt-0.5">Gifts</span>
          </button>

          {/* Bizzy AI Shopping Concierge */}
          <button
            onClick={() => {
              if (onOpenBizzy) onOpenBizzy(product);
            }}
            className="flex flex-col items-center group"
            title="Ask Bizzy AI Assistant"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 backdrop-blur-md flex items-center justify-center text-black font-black shadow-lg shadow-cyan-500/30 hover:scale-105 transition">
              <Sparkles className="w-4 h-4 fill-black" />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 drop-shadow mt-0.5">Bizzy</span>
          </button>

          {/* Share */}
          <button onClick={() => setIsShareOpen(true)} className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/15 shadow-md hover:bg-black/70 transition">
              <Share2 className="w-4 h-4 text-purple-300" />
            </div>
            <span className="text-[10px] font-semibold text-white drop-shadow mt-0.5">
              {product.baseShares.toLocaleString()}
            </span>
          </button>

          {/* Shop Drawer Button */}
          <button
            onClick={() => {
              if (onOpenCheckoutModal) {
                onOpenCheckoutModal(product);
              } else {
                handleOpenDrawer();
              }
            }}
            className="flex flex-col items-center group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 transition-transform active:scale-95">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 drop-shadow mt-0.5">Shop</span>
          </button>
        </div>

        {/* Bottom Overlay: Merchant Identity & Product Tag Pill */}
        <div className="absolute bottom-4 left-3 right-16 z-30 flex flex-col gap-1.5">
          {/* Merchant Profile Handle */}
          <div className="flex items-center gap-1.5">
            <img
              src={product.sellerAvatar}
              alt={product.sellerName}
              className="w-6 h-6 rounded-full border border-white/80 object-cover"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white text-xs font-bold drop-shadow">
                @{product.sellerName.replace(/\s+/g, '').toLowerCase()}
              </span>
              {product.isSellerVerified && (
                <span title="Verified Business Identification" className="inline-flex items-center text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 fill-emerald-400 text-black" />
                </span>
              )}
              {product.sellerTier === 'PREMIUM' && (
                <span className="bg-amber-400/90 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5" /> PREMIUM
                </span>
              )}
            </div>
          </div>

          {/* Product Description */}
          <p className="text-[11px] text-zinc-200 line-clamp-1 leading-relaxed drop-shadow font-normal">
            {product.description}
          </p>

          {/* Hashtags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.tags.map(t => (
              <span key={t} className="text-[10px] font-semibold text-cyan-400 drop-shadow">
                #{t}
              </span>
            ))}
          </div>

          {/* Interactive Floating Product Tag */}
          <div
            onClick={() => {
              if (onOpenCheckoutModal) onOpenCheckoutModal(product);
              else handleOpenDrawer();
            }}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer hover:bg-zinc-800 transition-all active:scale-[0.98]"
          >
            <img
              src={product.thumbnailUrl}
              alt={product.title}
              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{product.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-black text-emerald-400">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-[9px] text-zinc-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-[8px] bg-red-500/90 text-white font-bold px-1 rounded">
                  25% OFF
                </span>
              </div>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                if (onOpenCheckoutModal) onOpenCheckoutModal(product);
                else handleOpenDrawer();
              }}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-[10px] px-2.5 py-1 rounded-lg shrink-0 shadow-md transition"
            >
              BUY
            </button>
          </div>
        </div>

        {/* Video Duration / Watch Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, (watchSeconds / 15) * 100)}%` }}
          />
        </div>
      </div>

      {/* Product Drawer Bottom Sheet */}
      {isDrawerOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-zinc-900 border-t border-zinc-700 rounded-t-3xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85%] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Instant Video Checkout
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3 items-center">
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="w-16 h-16 rounded-xl object-cover border border-zinc-700"
              />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white line-clamp-1">{product.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                  <span>Sold by {product.sellerName}</span>
                  {product.isSellerVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-black text-emerald-400">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="text-[10px] text-zinc-400">({product.stockCount} in stock)</span>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-2 py-1">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-800/80 text-[11px] text-zinc-300">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Express 2-Day Air</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-800/80 text-[11px] text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Escrow</span>
              </div>
            </div>

            {/* Instant Checkout Action */}
            <button
              onClick={handleInstantBuy}
              disabled={isPurchased}
              className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                isPurchased
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black'
              }`}
            >
              {isPurchased ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Order Placed & Escrow Secured!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Complete 1-Tap Purchase • ${product.price.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Comments Drawer */}
      {isCommentsOpen && (
        <CommentsModal
          productTitle={product.title}
          onClose={() => setIsCommentsOpen(false)}
        />
      )}

      {/* Share Drawer */}
      {isShareOpen && (
        <ShareModal
          productTitle={product.title}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
