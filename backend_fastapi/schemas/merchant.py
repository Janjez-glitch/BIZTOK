from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

CountryCode = Literal["US", "EU", "UK", "SG", "GLOBAL"]
IdType = Literal["EIN", "VAT", "CRN", "UEN", "DUNS"]
MerchantTier = Literal["STANDARD", "PREMIUM"]

class BusinessVerificationRequest(BaseModel):
    business_name: str = Field(..., min_length=3, description="Legal Registered Business Entity Name")
    country: CountryCode = Field(..., description="Jurisdiction of Incorporation")
    id_type: IdType = Field(..., description="Official Government Business Identifier Type")
    id_number: str = Field(..., min_length=5, description="EIN, VAT, CRN, or UEN number")
    registered_address: str = Field(..., min_length=8, description="Commercial physical or registered office address")
    beneficial_owner_name: str = Field(..., min_length=3, description="Full legal name of primary beneficial owner or authorized director")
    industry_category: str = Field(..., description="Primary commercial activity category")

class VerificationDetails(BaseModel):
    formatted_id: str
    jurisdiction: str
    risk_score: int
    registry_status: str

class BusinessVerificationResponse(BaseModel):
    is_valid: bool
    merchant_id: str
    business_name: str
    verification_badge: Literal["VERIFIED_BUSINESS", "NONE"]
    tax_registry_checksum_passed: bool
    verified_at: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    details: Optional[VerificationDetails] = None

class MerchantProfile(BaseModel):
    merchant_id: str
    business_name: str
    is_verified: bool
    tier: MerchantTier
    id_type: IdType
    id_number: str
    country: CountryCode
    created_at: datetime
    verified_at: Optional[datetime] = None
