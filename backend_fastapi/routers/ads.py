from fastapi import APIRouter, Depends
from typing import Dict, Any

from backend_fastapi.schemas.ad import AdGeneratorRequest, AdGeneratorResponse
from backend_fastapi.middleware.merchant_verification import require_verified_merchant
from backend_fastapi.services.gemini_ad_generator import GeminiAdGeneratorService

router = APIRouter(prefix="/ads", tags=["AI Ad Studio (Multimodal)"])

@router.post("/generate-video-ad", response_model=AdGeneratorResponse)
def generate_multimodal_video_ad(
    payload: AdGeneratorRequest,
    merchant: Dict[str, Any] = Depends(require_verified_merchant)
):
    """
    Multimodal AI Ad Generator Endpoint:
    Strictly protected by `require_verified_merchant` middleware dependency.
    Uploads a product image and prompt, calls Gemini 3.8 Flash to produce:
    - High-conversion marketing caption
    - Trending viral hashtags
    - 15-second timed script template (Hook, Problem, Demo, CTA)
    """
    result = GeminiAdGeneratorService.generate_video_ad(payload)
    return result
