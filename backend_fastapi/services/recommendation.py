"""
Algorithmic Feed Recommendation Engine for BizTok.
Prioritizes products using:
1. Dynamic User Category Affinity Vector (updated real-time via swipe telemetry)
2. Historical Engagement (CTR, Completion Rate, Re-watch Loop ratio)
3. Freshness / Recency Exponential Decay
4. Seller 'Premium Account Tier' Algorithmic Multiplier (+35% priority distribution)
5. Anti-Clustering Diversity Re-ranking
"""

import math
from datetime import datetime, timezone
from typing import List, Dict, Tuple, Optional
from backend_fastapi.schemas.feed import (
    FeedProductItem,
    RankedFeedItem,
    ScoreBreakdown,
    UserAffinityProfile,
    SwipeInteractionPayload,
    CategoryType
)
from backend_fastapi.config import settings

class RecommendationService:
    @staticmethod
    def calculate_item_score(
        product: FeedProductItem,
        profile: UserAffinityProfile,
        preceding_category: Optional[CategoryType] = None
    ) -> ScoreBreakdown:
        # 1. Category Affinity (0.05 to 1.0)
        affinity = profile.affinities.get(product.category, 0.5)
        affinity_score = round(affinity * settings.ALGORITHM_AFFINITY_WEIGHT, 4)

        # 2. Historical Engagement Signal (CTR * 0.4 + WatchRatio * 0.6)
        engagement_base = (product.historical_ctr * 0.4) + (product.avg_watch_ratio * 0.6)
        engagement_score = round(engagement_base * settings.ALGORITHM_ENGAGEMENT_WEIGHT, 4)

        # 3. Recency Decay (Exponential Half-Life of 48 Hours)
        now = datetime.now(timezone.utc)
        pub_date = product.published_at.replace(tzinfo=timezone.utc) if product.published_at.tzinfo is None else product.published_at
        age_hours = max(0.0, (now - pub_date).total_seconds() / 3600.0)
        freshness = math.exp(-math.log(2) * (age_hours / 48.0))
        recency_score = round(freshness * settings.ALGORITHM_RECENCY_WEIGHT, 4)

        # 4. Premium Account Tier Boost
        # Sellers who subscribe to 'Premium Tier' receive a 1.35x multiplier
        seller_tier_multiplier = (
            settings.PREMIUM_TIER_BOOST_MULTIPLIER 
            if product.seller_tier == "PREMIUM" 
            else 1.00
        )

        # 5. Anti-clustering Category Diversity Penalty
        diversity_penalty = 0.85 if (preceding_category and preceding_category == product.category) else 1.00

        # 6. Negative dampener for products seen in the last 5 swipes
        recently_viewed_dampener = 0.30 if product.id in profile.recent_viewed_ids[:5] else 1.00

        raw_base = affinity_score + engagement_score + recency_score
        final_score = round(
            raw_base * seller_tier_multiplier * diversity_penalty * recently_viewed_dampener,
            4
        )

        return ScoreBreakdown(
            affinity_score=affinity_score,
            engagement_score=engagement_score,
            recency_score=recency_score,
            seller_tier_multiplier=seller_tier_multiplier,
            diversity_penalty=diversity_penalty,
            final_score=final_score
        )

    @classmethod
    def rank_feed(
        cls,
        candidates: List[FeedProductItem],
        profile: UserAffinityProfile
    ) -> List[RankedFeedItem]:
        # Initial score calculation without preceding context
        scored_candidates: List[Tuple[FeedProductItem, ScoreBreakdown]] = [
            (prod, cls.calculate_item_score(prod, profile))
            for prod in candidates
        ]

        # Order by candidate score descending
        scored_candidates.sort(key=lambda x: x[1].final_score, reverse=True)

        # Apply sequential diversity re-ranking to guarantee category variation
        ranked_results: List[RankedFeedItem] = []
        pool = list(scored_candidates)

        while pool:
            last_cat = ranked_results[-1].product.category if ranked_results else None

            # Pick top candidate that isn't the identical category if available
            chosen_idx = 0
            for i, (p, _) in enumerate(pool):
                if p.category != last_cat:
                    chosen_idx = i
                    break

            chosen_prod, _ = pool.pop(chosen_idx)
            # Recompute with contextual diversity penalty
            final_breakdown = cls.calculate_item_score(chosen_prod, profile, preceding_category=last_cat)

            ranked_results.append(
                RankedFeedItem(product=chosen_prod, score_breakdown=final_breakdown)
            )

        return ranked_results

    @staticmethod
    def process_swipe_telemetry(
        profile: UserAffinityProfile,
        interaction: SwipeInteractionPayload
    ) -> UserAffinityProfile:
        current_affinity = profile.affinities.get(interaction.category, 0.5)

        # Scoring deltas based on user micro-behavior
        delta_map = {
            "SKIP_FAST": -0.15,       # Swiped within < 2 seconds
            "WATCH_PARTIAL": 0.05,    # Watched 30-70% of video
            "WATCH_COMPLETE": 0.18,   # Watched to completion
            "LOOPED": 0.28,           # Re-watched video
            "LIKE": 0.22,             # Double-tapped or liked
            "OPEN_DRAWER": 0.32,      # Tapped product overlay
            "BUY": 0.45               # Completed instant checkout
        }

        delta = delta_map.get(interaction.action, 0.0)
        learning_rate = 0.35
        updated_affinity = current_affinity + (delta * learning_rate)
        clamped_affinity = round(max(0.05, min(1.0, updated_affinity)), 4)

        new_affinities = dict(profile.affinities)
        new_affinities[interaction.category] = clamped_affinity

        # Update recently viewed cache
        updated_recent = [interaction.product_id] + [
            pid for pid in profile.recent_viewed_ids if pid != interaction.product_id
        ][:49]

        return UserAffinityProfile(
            user_id=profile.user_id,
            affinities=new_affinities,
            recent_viewed_ids=updated_recent,
            total_videos_watched=profile.total_videos_watched + 1,
            last_active=datetime.now(timezone.utc)
        )
