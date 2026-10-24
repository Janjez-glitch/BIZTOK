/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Radio,
  Sparkles,
  Users,
  Heart,
  MessageCircle,
  ShoppingBag,
  Zap,
  Clock,
  Pin,
  Film,
  Gift,
  Share2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Award,
  X
} from 'lucide-react';
import { FeedProduct } from '../lib/recommendationEngine';
import { TokGiftItem } from '../lib/tokGifts';

interface LiveStreamSuiteProps {
  products: FeedProduct[];
  onOpenCheckout: (product: FeedProduct) => void;
  onOpenGifts: () => void;
  onClipToAdGenerated: (adPackage: any) => void;
  isMerchantVerified: boolean;
}

export function LiveStreamSuite({
  products,
  onOpenCheckout,
  onOpenGifts,
  onClipToAdGenerated,
  isMerchantVerified,
}: LiveStreamSuiteProps) {
  const [liveState, setLiveState] = useState<any>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(540);
  const [liveChat, setLiveChat] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);
  const [isClippingToAd, setIsClippingToAd] = useState(false);
  const [clipSuccessModal, setClipSuccessModal] = useState<any>(null);

  // Fetch live state
  const fetchLiveState = async () => {
    try {
      const res = await fetch('/api/livestream/state');
      const data = await res.json();
      if (data.liveStream) {
        setLiveState(data.liveStream);
        setLiveChat(data.liveStream.liveChat || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLiveState();
  }, []);

  // Flash deal countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setLiveChat(prev => [
      {
        id: `chat_${Date.now()}`,
        user: 'you',
        message: newChatMessage.trim(),
        time: 'Just now',
        isVerifiedBuyer: true,
      },
      ...prev,
    ]);
    setNewChatMessage('');
  };

  const handleHeartReaction = () => {
    const id = Date.now();
    const left = Math.floor(Math.random() * 60 + 20);
    setFloatingHearts(prev => [...prev, { id, left }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  };

  // Automated Clip-to-Ad trigger
  const handleClipToAd = async () => {
    setIsClippingToAd(true);
    try {
      const pinned = liveState?.pinnedProduct;
      const res = await fetch('/api/livestream/clip-to-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamSnippet: 'Streamer highlights the magnetic auto-align snap and demonstrates charging 3 devices at once with zero heat.',
          productTitle: pinned?.title || 'OrbitFlow 3-in-1 Foldable MagSafe Dock',
          highlightTimestamp: '00:14:22 - 00:14:37',
        }),
      });

      const data = await res.json();
      setClipSuccessModal(data);
      onClipToAdGenerated(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClippingToAd(false);
    }
  };

  const pinnedProd = liveState?.pinnedProduct;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Broadcast Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-black shadow-lg shadow-red-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-black animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> LIVE BROADCAST
              </span>
              <h2 className="text-base font-black text-white">
                {liveState?.streamTitle || '⚡ LIVE FLASH SALE: Handcrafted Ceramics & Fast MagSafe Docks'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hosted by <strong className="text-zinc-200">@{liveState?.streamerName || 'OrbitFlow'}</strong> • Verified Merchant Stream
            </p>
          </div>
        </div>

        {/* Live Counters & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>{liveState?.viewerCount || 1420} watching</span>
          </div>

          {/* Automated Clip-to-Ad Action */}
          <button
            onClick={handleClipToAd}
            disabled={isClippingToAd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 text-white text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50"
            title="Convert broadcast highlight into a 15-second Ad Studio package"
          >
            {isClippingToAd ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Clipping Highlight...</span>
              </span>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>Automated Clip-to-Ad</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Broadcast Studio View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stream Video Simulator & Pinned Product Overlay (Left 8 Cols) */}
        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-black aspect-[16/10] sm:aspect-[16/9] border-2 border-zinc-800 shadow-2xl flex flex-col justify-between p-4 sm:p-6 group select-none">
          {/* Background Video Stream Surface */}
          <img
            src="https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=80"
            alt="Live Stream Surface"
            className="absolute inset-0 w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

          {/* Floating animated reaction hearts */}
          {floatingHearts.map(h => (
            <div
              key={h.id}
              className="absolute bottom-24 text-red-500 pointer-events-none animate-bounce"
              style={{ left: `${h.left}%` }}
            >
              <Heart className="w-7 h-7 fill-red-500 drop-shadow-lg" />
            </div>
          ))}

          {/* Top Live Badges & Host Identity */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE
              </span>
              <span className="bg-black/60 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-cyan-400" /> 1,420 viewers
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenGifts}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Send TokGift</span>
              </button>

              <button
                onClick={handleHeartReaction}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-red-500 border border-white/20 hover:scale-110 active:scale-90 transition"
              >
                <Heart className="w-4 h-4 fill-red-500" />
              </button>
            </div>
          </div>

          {/* Bottom Flash Deal: Pulsating 'Pinned Product' Overlay */}
          <div className="relative z-10">
            {pinnedProd && (
              <div className="bg-gradient-to-r from-zinc-950/95 via-black/95 to-zinc-950/95 backdrop-blur-xl border-2 border-amber-400/80 rounded-2xl p-3.5 shadow-2xl shadow-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <img
                      src={pinnedProd.thumbnailUrl}
                      alt={pinnedProd.title}
                      className="w-14 h-14 rounded-xl object-cover border border-amber-400 shrink-0"
                    />
                    <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider">
                      -{pinnedProd.discountPercent}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-amber-400" /> PINNED FLASH DEAL
                      </span>
                      <span className="bg-red-950/80 text-red-300 border border-red-800 text-[10px] font-mono font-bold px-1.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Ends in {formatCountdown(countdownSeconds)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                      {pinnedProd.title}
                    </h4>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm sm:text-base font-black text-emerald-400">
                        ${pinnedProd.flashPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-500 line-through">
                        ${pinnedProd.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        ({pinnedProd.stockRemaining} left at flash price)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => {
                    const match = products.find(p => p.id === pinnedProd.id) || products[0];
                    onOpenCheckout({
                      ...match,
                      price: pinnedProd.flashPrice,
                      originalPrice: pinnedProd.originalPrice,
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 hover:from-amber-300 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xl shadow-amber-500/30 transition active:scale-95 shrink-0"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>BUY FLASH DEAL • ESCROW SECURED</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Stream & TokGift Feed (Right 4 Cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-cyan-400" /> Live Stream Chat
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              Verified Buyers Active
            </span>
          </div>

          {/* Chat message stream */}
          <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-2.5 py-3 pr-1 text-xs">
            {liveChat.map(msg => (
              <div
                key={msg.id}
                className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200 flex items-center gap-1">
                    @{msg.user}
                    {msg.isVerifiedBuyer && (
                      <span title="Verified Buyer">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-zinc-500">{msg.time}</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">{msg.message}</p>
              </div>
            ))}
          </div>

          {/* Live Chat Input */}
          <form onSubmit={handleSendLiveChat} className="flex gap-2 pt-3 border-t border-zinc-800">
            <input
              type="text"
              value={newChatMessage}
              onChange={e => setNewChatMessage(e.target.value)}
              placeholder="Ask streamer or say something..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shrink-0 font-bold"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Clip-to-Ad Confirmation Modal */}
      {clipSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-purple-500/50 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Clip-to-Ad Created!</h3>
                  <p className="text-[11px] text-zinc-400">Stream moment parsed by Gemini into a 15s TikTok ad package</p>
                </div>
              </div>
              <button
                onClick={() => setClipSuccessModal(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 flex flex-col gap-2.5 text-xs">
              <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">
                VIRAL HOOK OVERLAY
              </span>
              <p className="text-sm font-black text-white italic">
                "{clipSuccessModal.viral_hook_headline}"
              </p>

              <span className="text-zinc-400 font-semibold text-[11px] mt-1">
                Generated Marketing Caption:
              </span>
              <p className="text-zinc-300 leading-relaxed text-xs">
                {clipSuccessModal.marketing_caption}
              </p>

              <div className="flex flex-wrap gap-1 mt-1">
                {clipSuccessModal.hashtags?.map((t: string) => (
                  <span key={t} className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                onClipToAdGenerated(clipSuccessModal);
                setClipSuccessModal(null);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-900/30"
            >
              Open in AI Ad Studio & Publish to Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
