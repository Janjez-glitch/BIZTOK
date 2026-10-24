"""
BizTok Core FastAPI Application.
Main entry point for the video-first mobile marketplace backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend_fastapi.config import settings
from backend_fastapi.routers import merchants, feed, ads

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Video-First Shopping Marketplace API with Verified Business Registration, Algorithmic Recommendation Ranking, and Multimodal Gemini AI Ad Generation."
)

# Cross-Origin Resource Sharing for React Native / Expo and Web Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core domain routers
app.include_router(merchants.router, prefix="/api/v1")
app.include_router(feed.router, prefix="/api/v1")
app.include_router(ads.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "platform": settings.APP_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "capabilities": [
            "Verified Business Registration Onboarding (EIN, VAT, CRN, UEN, DUNS)",
            "Algorithmic Video Feed with Category Affinity & +35% Premium Tier Multiplier",
            "Multimodal Gemini AI Ad Script & Caption Generator"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "biztok-core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
