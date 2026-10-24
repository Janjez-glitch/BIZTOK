from fastapi import APIRouter, Query
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta

from backend_fastapi.schemas.feed import (
    FeedProductItem,
    RankedFeedItem,
    SwipeInteractionPayload,
    UserAffinityProfile
)
from backend_fastapi.services.recommendation import RecommendationService

router = APIRouter(prefix="/feed", tags=["Algorithmic Feed"])

# In-memory storage for active user profiles
USER_PROFILES: Dict[str, UserAffinityProfile] = {
    "user_default": UserAffinityProfile(
        user_id="user_default",
        affinities={
            "tech": 0.55,
            "fashion": 0.50,
            "lifestyle": 0.50,
            "food": 0.50,
            "wellness": 0.50,
            "home": 0.50
        },
        recent_viewed_ids=[],
        total_videos_watched=0,
        last_active=datetime.now(timezone.utc)
    )
}

# Seed candidate product catalog
SAMPLE_PRODUCTS: List[FeedProductItem] = [
    FeedProductItem(
        id="prod_magsafe_stand",
        title="OrbitFlow 3-in-1 Foldable MagSafe Dock",
        price=49.00,
        original_price=69.00,
        category="tech",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41530-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80",
        seller_id="merch_demo_verified",
        seller_name="OrbitFlow Labs",
        seller_avatar="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        seller_tier="PREMIUM",
        is_seller_verified=True,
        base_likes=4820,
        base_shares=1230,
        historical_ctr=0.18,
        avg_watch_ratio=0.88,
        published_at=datetime.now(timezone.utc) - timedelta(hours=3),
        tags=["desksetup", "tech", "iphone", "wireless"],
        description="Aircraft-grade aluminum fast wireless charging dock with thermal cooling.",
        stock_count=84
    ),
    FeedProductItem(
        id="prod_nordic_mug",
        title="Komorebi Speckled Stoneware Ceramic Mug",
        price=34.00,
        original_price=42.00,
        category="lifestyle",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-41551-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        seller_id="merch_pottery_nordic",
        seller_name="Komorebi Clayworks",
        seller_avatar="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
        seller_tier="PREMIUM",
        is_seller_verified=True,
        base_likes=6190,
        base_shares=940,
        historical_ctr=0.14,
        avg_watch_ratio=0.85,
        published_at=datetime.now(timezone.utc) - timedelta(hours=8),
        tags=["ceramics", "coffee", "handmade", "aesthetic"],
        description="Fired at 1280°C in small Kyoto batches. Ergonomic thumb-rest handle.",
        stock_count=22
    ),
    FeedProductItem(
        id="prod_selvedge_jacket",
        title="Kuroki Mills 14oz Raw Selvedge Boxy Jacket",
        price=185.00,
        original_price=220.00,
        category="fashion",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-vintage-store-looking-at-clothes-41556-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
        seller_id="merch_kuroki_denim",
        seller_name="Atelier Indigo",
        seller_avatar="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80",
        seller_tier="STANDARD",
        is_seller_verified=True,
        base_likes=3240,
        base_shares=410,
        historical_ctr=0.09,
        avg_watch_ratio=0.72,
        published_at=datetime.now(timezone.utc) - timedelta(hours=14),
        tags=["denim", "rawdenim", "streetwear", "ootd"],
        description="Woven on vintage shuttle looms in Okayama. Solid brass hardware.",
        stock_count=16
    ),
    FeedProductItem(
        id="prod_matcha_whisk_kit",
        title="Uji Ceremonial First-Harvest Matcha Set",
        price=52.00,
        original_price=65.00,
        category="food",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-a-glass-of-iced-coffee-41550-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
        seller_id="merch_uji_matcha",
        seller_name="Tencha Heritage",
        seller_avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80",
        seller_tier="PREMIUM",
        is_seller_verified=True,
        base_likes=5800,
        base_shares=1550,
        historical_ctr=0.16,
        avg_watch_ratio=0.81,
        published_at=datetime.now(timezone.utc) - timedelta(hours=6),
        tags=["matcha", "ceremonial", "japan", "wellness"],
        description="Includes 100-prong bamboo chasen, handcrafted chawan bowl, and 30g tin.",
        stock_count=35
    ),
    FeedProductItem(
        id="prod_amber_lamp",
        title="Helios Wireless Dimmable Ambient Sphere",
        price=68.00,
        original_price=89.00,
        category="home",
        video_url="https://assets.mixkit.co/videos/preview/mixkit-hands-working-on-a-clay-vase-41549-large.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
        seller_id="merch_helios_light",
        seller_name="Lumen Studio",
        seller_avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        seller_tier="STANDARD",
        is_seller_verified=True,
        base_likes=2100,
        base_shares=310,
        historical_ctr=0.11,
        avg_watch_ratio=0.69,
        published_at=datetime.now(timezone.utc) - timedelta(hours=22),
        tags=["homedecor", "lighting", "aesthetic", "cozy"],
        description="Touch-sensitive warm 2200K amber glow with 24-hour rechargeable battery.",
        stock_count=40
    )
]

@router.get("/ranked", response_model=List[RankedFeedItem])
def get_algorithmic_feed(user_id: str = Query("user_default")):
    """
    Algorithmic Feed Endpoint:
    Ranks products using the user's category affinity vector, historical watch completion,
    recency decay, and seller 'Premium Account tier' (+35% boost).
    """
    profile = USER_PROFILES.get(user_id)
    if not profile:
        profile = UserAffinityProfile(
            user_id=user_id,
            affinities={"tech": 0.5, "fashion": 0.5, "lifestyle": 0.5, "food": 0.5, "wellness": 0.5, "home": 0.5},
            recent_viewed_ids=[],
            total_videos_watched=0,
            last_active=datetime.now(timezone.utc)
        )
        USER_PROFILES[user_id] = profile

    ranked_items = RecommendationService.rank_feed(SAMPLE_PRODUCTS, profile)
    return ranked_items

@router.post("/interaction", response_model=UserAffinityProfile)
def record_swipe_interaction(telemetry: SwipeInteractionPayload):
    """
    Swipe Telemetry Ingestion:
    Receives real-time micro-actions (fast swipe-away, complete watch, loop, drawer click, like)
    and updates the user's personalized category affinity vector immediately.
    """
    profile = USER_PROFILES.get(telemetry.user_id)
    if not profile:
        profile = UserAffinityProfile(
            user_id=telemetry.user_id,
            affinities={"tech": 0.5, "fashion": 0.5, "lifestyle": 0.5, "food": 0.5, "wellness": 0.5, "home": 0.5},
            recent_viewed_ids=[],
            total_videos_watched=0,
            last_active=datetime.now(timezone.utc)
        )

    updated = RecommendationService.process_swipe_telemetry(profile, telemetry)
    USER_PROFILES[telemetry.user_id] = updated
    return updated
