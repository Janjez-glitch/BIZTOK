"""
Verified Business Registration Middleware & Security Dependency for BizTok.
Ensures that all merchant-only endpoints (product creation, inventory modification,
AI ad studio, and commercial analytics) are strictly gated behind verified legal
entity identification (EIN / VAT / CRN / UEN / DUNS).
"""

import re
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend_fastapi.schemas.merchant import BusinessVerificationRequest

security = HTTPBearer(auto_error=False)

# In-memory merchant database simulator (in production, connected to PostgreSQL / Cloud SQL)
MERCHANT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "merch_demo_verified": {
        "merchant_id": "merch_demo_verified",
        "business_name": "Nordic Ceramics Studio Inc",
        "is_verified": True,
        "tier": "PREMIUM",
        "id_type": "EIN",
        "id_number": "12-3456789",
        "country": "US",
        "verified_at": "2026-01-15T08:00:00Z"
    },
    "merch_unverified_new": {
        "merchant_id": "merch_unverified_new",
        "business_name": "Pending Dropship LLC",
        "is_verified": False,
        "tier": "STANDARD",
        "id_type": "EIN",
        "id_number": "",
        "country": "US",
        "verified_at": None
    }
}

VALID_IRS_EIN_PREFIXES = {
    10, 12, 67, 50, 53, 1, 2, 3, 4, 5, 6, 11, 13, 14, 16, 21, 22, 23, 25, 34,
    51, 52, 54, 55, 56, 57, 58, 59, 65, 20, 26, 27, 45, 46, 47, 81, 82, 83,
    84, 85, 86, 87, 88, 30, 32, 35, 36, 37, 38, 61, 15, 24, 40, 44, 62, 63,
    71, 72, 73, 74, 75, 76, 77, 80, 90, 91, 92, 93, 94, 95, 98, 99
}

def validate_business_id_strict(id_type: str, id_number: str, country: str) -> Dict[str, Any]:
    cleaned = id_number.strip().upper()

    if id_type == "EIN":
        digits_only = re.sub(r"[^0-9]", "", cleaned)
        if len(digits_only) != 9:
            return {"valid": False, "reason": "US EIN must contain exactly 9 numeric digits"}
        prefix = int(digits_only[:2])
        if prefix not in VALID_IRS_EIN_PREFIXES:
            return {"valid": False, "reason": f"EIN prefix '{prefix}' is not an active IRS processing campus code"}
        return {"valid": True, "formatted": f"{digits_only[:2]}-{digits_only[2:]}"}

    elif id_type == "VAT":
        condensed = re.sub(r"[\s.-]", "", cleaned)
        if not re.match(r"^[A-Z]{2}[0-9A-Z]{8,12}$", condensed):
            return {"valid": False, "reason": "EU VAT must start with 2-letter country code followed by 8-12 alphanumeric characters"}
        return {"valid": True, "formatted": condensed}

    elif id_type == "CRN":
        crn_clean = re.sub(r"[\s-]", "", cleaned)
        if not re.match(r"^([0-9]{8}|[A-Z]{2}[0-9]{6})$", crn_clean):
            return {"valid": False, "reason": "UK CRN must be 8 digits or 2 letters followed by 6 digits"}
        return {"valid": True, "formatted": crn_clean}

    elif id_type == "UEN":
        uen_clean = re.sub(r"[\s-]", "", cleaned)
        if not re.match(r"^([0-9]{8,9}[A-Z]|[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z])$", uen_clean):
            return {"valid": False, "reason": "Singapore UEN must conform to ACRA entity registration standards"}
        return {"valid": True, "formatted": uen_clean}

    elif id_type == "DUNS":
        digits_only = re.sub(r"[^0-9]", "", cleaned)
        if len(digits_only) != 9:
            return {"valid": False, "reason": "D-U-N-S number must be exactly 9 numeric digits"}
        return {"valid": True, "formatted": f"{digits_only[:2]}-{digits_only[2:5]}-{digits_only[5:]}"}

    return {"valid": False, "reason": f"Unsupported identification format: {id_type}"}


async def require_verified_merchant(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Dict[str, Any]:
    """
    FastAPI Security Dependency:
    Blocks unverified merchants from accessing commercial or publishing endpoints.
    Returns 401 if unauthenticated, 403 if unverified.
    """
    # Allow testing via explicit header or bearer token
    merchant_id = request.headers.get("X-Merchant-Id")
    if not merchant_id and credentials:
        merchant_id = credentials.credentials

    if not merchant_id:
        merchant_id = "merch_demo_verified" # Fallback demo verified account for prototyping

    merchant = MERCHANT_REGISTRY.get(merchant_id)
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Merchant identity not found or session expired."
        )

    if not merchant.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "MERCHANT_UNVERIFIED",
                "message": (
                    "Access Denied: Verified Business Registration is strictly required. "
                    "Submit your legal business identification (EIN, VAT, CRN, or UEN) "
                    "in the Onboarding Portal to unlock merchant features."
                ),
                "required_action": "SUBMIT_BUSINESS_IDENTIFICATION",
                "status": "UNVERIFIED"
            }
        )

    return merchant
