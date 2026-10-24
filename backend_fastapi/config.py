import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "BizTok API"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ALGORITHM_AFFINITY_WEIGHT: float = 0.45
    ALGORITHM_ENGAGEMENT_WEIGHT: float = 0.35
    ALGORITHM_RECENCY_WEIGHT: float = 0.20
    PREMIUM_TIER_BOOST_MULTIPLIER: float = 1.35
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings()
