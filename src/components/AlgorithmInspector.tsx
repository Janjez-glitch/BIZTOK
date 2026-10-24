/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  RotateCcw,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  UserAffinityProfile,
  RankedFeedItem,
  ProductCategory,
  DEFAULT_CATEGORIES
} from '../lib/recommendationEngine';

interface AlgorithmInspectorProps {
  userProfile: UserAffinityProfile;
  currentRankedItem?: RankedFeedItem;
  rankedFeed: RankedFeedItem[];
  onTriggerSimulation: (category: ProductCategory, action: 'SKIP_FAST' | 'WATCH_COMPLETE' | 'BUY') => void;
  onResetProfile: () => void;
}

export function AlgorithmInspector({
  userProfile,
  currentRankedItem,
  rankedFeed,
  onTriggerSimulation,
  onResetProfile,
}: AlgorithmInspectorProps) {
  const breakdown = currentRankedItem?.scoreBreakdown;
  const product = currentRankedItem?.product;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-5 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Algorithmic Recommendation Engine
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Real-Time Ranker
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Live score decomposition and category affinity vector updates
            </p>
          </div>
        </div>

        <button
          onClick={onResetProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
          title="Reset user affinities to default 0.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Vector</span>
        </button>
      </div>

      {/* Active Video Score Equation Decomposition */}
      {breakdown && product && (
        <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Active Product Score Decomposition
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-mono">Category: <strong className="text-white capitalize">{product.category}</strong></span>
              <span className="text-sm font-black text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-800">
                Score: {breakdown.finalScore.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Mathematical Formula Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            {/* Affinity Component */}
            <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-[11px] font-semibold">Category Affinity (45%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-emerald-400 font-bold font-mono">+{breakdown.affinityScore.toFixed(4)}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Aff: {(userProfile.affinities[product.category] ?? 0.5).toFixed(2)}</span>
              </div>
            </div>

            {/* Engagement Component */}
            <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-[11px] font-semibold">Engagement (35%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-cyan-400 font-bold font-mono">+{breakdown.engagementScore.toFixed(4)}</span>
                <span className="text-[10px] text-zinc-500 font-mono">CTR: {(product.historicalCtr * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Recency Component */}
            <div className="bg-zinc-900/90 rounded-lg p-2.5 border border-zinc-800 flex flex-col justify-between">
              <span className="text-zinc-400 text-[11px] font-semibold">Recency Decay (20%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-purple-400 font-bold font-mono">+{breakdown.recencyScore.toFixed(4)}</span>
                <span className="text-[10px] text-zinc-500 font-mono">T½ = 48h</span>
              </div>
            </div>

            {/* Seller Tier Multiplier */}
            <div className={`rounded-lg p-2.5 border flex flex-col justify-between ${
              product.sellerTier === 'PREMIUM'
                ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                : 'bg-zinc-900/90 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Seller Tier Multiplier</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-extrabold text-sm text-amber-400 font-mono">
                  {breakdown.sellerTierMultiplier.toFixed(2)}x
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {product.sellerTier === 'PREMIUM' ? '+35% BOOST' : 'STANDARD'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Category Affinity Vector Bar Chart */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            User Category Affinity Vector ({userProfile.totalVideosWatched} interactions)
          </span>
          <span className="text-[11px] text-zinc-400">Values range 0.05 (Averse) to 1.00 (High Intent)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {DEFAULT_CATEGORIES.map(cat => {
            const val = userProfile.affinities[cat] ?? 0.5;
            const pct = Math.round(val * 100);
            return (
              <div key={cat} className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-semibold text-zinc-200">{cat}</span>
                  <span className="font-mono font-bold text-cyan-400 text-[11px]">{val.toFixed(2)}</span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      val >= 0.7 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : val <= 0.3 ? 'bg-red-400' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Telemetry Simulator Controls */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Test Algorithmic Reactivity (One-Click Micro-Behaviors)
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTriggerSimulation('tech', 'SKIP_FAST')}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs font-semibold text-red-300 transition"
          >
            ⚡ Fast Skip on Tech (-15% Affinity)
          </button>
          <button
            onClick={() => onTriggerSimulation('lifestyle', 'WATCH_COMPLETE')}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-xs font-semibold text-emerald-300 transition"
          >
            ☕ 100% Watch on Lifestyle (+18% Affinity)
          </button>
          <button
            onClick={() => onTriggerSimulation('fashion', 'BUY')}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 text-xs font-semibold text-cyan-300 transition"
          >
            🛍️ 1-Tap Purchase on Fashion (+45% Affinity)
          </button>
        </div>
      </div>

      {/* Ranked Queue Order */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Live Feed Ranking Queue
        </span>
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {rankedFeed.map((item, idx) => (
            <div
              key={item.product.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                idx === 0
                  ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                  : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 font-bold font-mono text-zinc-500">#{idx + 1}</span>
                <span className="font-semibold truncate">{item.product.title}</span>
                <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                  {item.product.category}
                </span>
                {item.product.sellerTier === 'PREMIUM' && (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-1 rounded">
                    PREMIUM
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-zinc-200 ml-2 shrink-0">
                {item.scoreBreakdown.finalScore.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
