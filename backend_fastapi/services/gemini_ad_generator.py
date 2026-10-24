"""
Multimodal AI Ad Generator Service using Gemini.
Ingests a product image (base64) along with text prompt parameters (target audience,
selling points, tone, discount) and generates high-converting marketing copy,
viral hashtags, and an exact 15-second timed video script template.
"""

import json
import base64
from typing import Dict, Any
from google import genai
from google.genai import types
from backend_fastapi.config import settings
from backend_fastapi.schemas.ad import AdGeneratorRequest, AdGeneratorResponse, ScriptSegment

class GeminiAdGeneratorService:
    @classmethod
    def generate_video_ad(cls, req: AdGeneratorRequest) -> AdGeneratorResponse:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Decode base64 image data
        clean_base64 = req.image_base64
        if "," in clean_base64:
            clean_base64 = clean_base64.split(",")[1]

        image_bytes = base64.b64decode(clean_base64)

        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=req.mime_type or "image/jpeg"
        )

        prompt_instruction = f"""
        You are an elite short-form mobile video marketing director for 'BizTok'.
        Analyze the uploaded product image and the merchant's specifications:
        - Product Name: {req.product_name}
        - Product Category: {req.product_category}
        - Key Selling Points: {req.key_selling_points}
        - Target Audience: {req.target_audience}
        - Creative Tone: {req.tone}
        - Discount / Incentive: {req.discount_offer or 'Standard Offer'}
        - Language: {req.language}

        Generate a high-converting, viral TikTok / Reels shopping video package.
        Return a strict JSON object with:
        1. "viral_hook_headline": An irresistible text overlay hook for the first 2 seconds (e.g., "Stop scrolling if your desk cable mess is driving you insane...")
        2. "marketing_caption": Engaging caption optimized for conversions with emojis and clear call to action.
        3. "hashtags": Array of 6-8 targeted hashtags (mix of viral tags, category tags, and merchant tags).
        4. "fifteen_second_script": Array of 4 chronological segments that total exactly 15 seconds:
           - Segment 1 (00:00 - 00:03, phase: "HOOK"): Visual hook, on-screen text, pattern-interrupt spoken audio.
           - Segment 2 (00:03 - 00:07, phase: "PROBLEM"): Agitate pain point or lifestyle aspiration.
           - Segment 3 (00:07 - 00:12, phase: "DEMO"): Demonstrate key feature/craftsmanship highlighted in the image.
           - Segment 4 (00:12 - 00:15, phase: "CALL_TO_ACTION"): Urgent urgency/discount incentive pointing to the bottom "Tap to Buy" tag.
        5. "recommended_audio_track_vibe": Music / sound design recommendation.
        6. "conversion_tips": Array of 2-3 tactical tips for the merchant when recording this video.
        """

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[image_part, prompt_instruction],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
            )
        )

        try:
            parsed = json.loads(response.text)
            segments = [
                ScriptSegment(
                    timestamp_range=s.get("timestamp_range", "00:00 - 00:03"),
                    phase=s.get("phase", "HOOK"),
                    visual_direction=s.get("visual_direction", ""),
                    spoken_audio=s.get("spoken_audio", ""),
                    sound_effect_cue=s.get("sound_effect_cue")
                )
                for s in parsed.get("fifteen_second_script", [])
            ]

            return AdGeneratorResponse(
                success=True,
                viral_hook_headline=parsed.get("viral_hook_headline", f"Discover {req.product_name}"),
                marketing_caption=parsed.get("marketing_caption", ""),
                hashtags=parsed.get("hashtags", ["#BizTokFinds", "#TikTokShop", "#MustHave"]),
                fifteen_second_script=segments,
                recommended_audio_track_vibe=parsed.get("recommended_audio_track_vibe", "Trending upbeat lofi"),
                conversion_tips=parsed.get("conversion_tips", ["Hold the product within the first 1 second."])
            )
        except Exception as e:
            # Fallback structured output in case of parsing anomaly
            return AdGeneratorResponse(
                success=True,
                viral_hook_headline=f"Wait until you see how this transforms your daily routine...",
                marketing_caption=f"Obsessed with the new {req.product_name}! 🔥 Use promo code to claim {req.discount_offer or 'special discount'} before it sells out. Link in bio & tap product below! 🛍️",
                hashtags=["#BizTokFinds", "#MustHaveProduct", "#ShopSmall", "#ViralProducts"],
                fifteen_second_script=[
                    ScriptSegment(
                        timestamp_range="00:00 - 00:03",
                        phase="HOOK",
                        visual_direction="Close-up hero shot of product unboxing with rapid zoom",
                        spoken_audio="If you're still doing this the old way, stop scrolling right now.",
                        sound_effect_cue="Vinyl scratch / whoosh"
                    ),
                    ScriptSegment(
                        timestamp_range="00:03 - 00:07",
                        phase="PROBLEM",
                        visual_direction="Split screen showing common frustration vs clean aesthetic setup",
                        spoken_audio=f"I used to struggle with this every single day until I found this.",
                        sound_effect_cue="Subtle chime"
                    ),
                    ScriptSegment(
                        timestamp_range="00:07 - 00:12",
                        phase="DEMO",
                        visual_direction="Crisp B-roll demonstrating main selling point with tactile sound",
                        spoken_audio=f"Look at the finish. {req.key_selling_points}",
                        sound_effect_cue="Crisp ASMR click"
                    ),
                    ScriptSegment(
                        timestamp_range="00:12 - 00:15",
                        phase="CALL_TO_ACTION",
                        visual_direction="Creator pointing down to yellow product pill badge",
                        spoken_audio=f"Tap the yellow cart badge below right now before they sell out!",
                        sound_effect_cue="Cash register ding"
                    )
                ],
                recommended_audio_track_vibe="High-tempo electro pop or viral trending acoustic",
                conversion_tips=[
                    "Point directly to the bottom left screen where the product badge renders.",
                    "Ensure good natural lighting to showcase texture."
                ]
            )
