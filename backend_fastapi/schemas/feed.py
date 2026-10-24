from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime

CategoryType = Literal["tech", "fashion", "lifestyle", "food", "wellness", "home"]
SwipeAction = Literal["SKIP_FAST", "WATCH_PARTIAL", "WATCH_COMPLETE", "LOOPED", "LIKE", "OPEN_DRAWER", "BUY"]

class FeedProductItem(BaseModel):
    id: str
    title: str
    price: float
    original_price: Optional[float] = None
    category: CategoryType
    video_url: str
    thumbnail_url: str
    seller_id: str
    seller_name: str
    seller_avatar: str
    seller_tier: Literal["STANDARD", "PREMIUM"]
    is_seller_verified: bool
    base_likes: int
    base_shares: int
    historical_ctr: float
    avg_watch_ratio: float
    published_at: datetime
    tags: List[str]
    description: str
    stock_count: int

class ScoreBreakdown(BaseModel):
    affinity_score: float
    engagement_score: float
    recency_score: float
    seller_tier_multiplier: float
    diversity_penalty: float
    final_score: float

class RankedFeedItem(BaseModel):
    product: FeedProductItem
    score_breakdown: ScoreBreakdown

class SwipeInteractionPayload(BaseModel):
    user_id: str = "user_default"
    product_id: str
    category: CategoryType
    watch_time_seconds: float
    video_duration_seconds: float
    action: SwipeAction

class UserAffinityProfile(BaseModel):
    user_id: str
    affinities: Dict[CategoryType, float]
    recent_viewed_ids: List[str]
    total_videos_watched: int
    last_active: datetime
