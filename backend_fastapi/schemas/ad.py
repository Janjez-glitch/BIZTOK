from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class ScriptSegment(BaseModel):
    timestamp_range: str = Field(..., description="e.g. '00:00 - 00:03'")
    phase: Literal["HOOK", "PROBLEM", "DEMO", "CALL_TO_ACTION"]
    visual_direction: str = Field(..., description="Camera angle, action, B-roll cue, on-screen text")
    spoken_audio: str = Field(..., description="Voiceover or creator direct-to-camera script")
    sound_effect_cue: Optional[str] = None

class AdGeneratorRequest(BaseModel):
    product_name: str
    product_category: str
    key_selling_points: str
    target_audience: str
    tone: Literal["High-Energy TikTok", "Minimalist Aesthetic", "Problem-Solution UGC", "Luxury Storytelling"]
    discount_offer: Optional[str] = None
    language: str = "en"
    image_base64: str = Field(..., description="Base64 encoded product photo or lifestyle still")
    mime_type: str = "image/jpeg"

class AdGeneratorResponse(BaseModel):
    success: bool
    viral_hook_headline: str
    marketing_caption: str
    hashtags: List[str]
    fifteen_second_script: List[ScriptSegment]
    recommended_audio_track_vibe: str
    conversion_tips: List[str]
