import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBusinessId, verifyBusinessOnboarding, enforceVerifiedMerchant, MerchantAccount } from './businessVerification';

test('validateBusinessId correctly validates US EIN', () => {
  // Valid IRS prefix (e.g. 12)
  const valid = validateBusinessId('EIN', '12-3456789', 'US');
  assert.equal(valid.valid, true);
  assert.equal(valid.formatted, '12-3456789');

  // Invalid length
  const invalidLength = validateBusinessId('EIN', '12-345', 'US');
  assert.equal(invalidLength.valid, false);

  // Invalid prefix
  const invalidPrefix = validateBusinessId('EIN', '00-1234567', 'US');
  assert.equal(invalidPrefix.valid, false);
});

test('validateBusinessId correctly validates EU VAT & UK CRN', () => {
  const validVat = validateBusinessId('VAT', 'DE123456789', 'EU');
  assert.equal(validVat.valid, true);

  const invalidVat = validateBusinessId('VAT', '12345', 'EU');
  assert.equal(invalidVat.valid, false);

  const validCrn = validateBusinessId('CRN', '01234567', 'UK');
  assert.equal(validCrn.valid, true);

  const validScottishCrn = validateBusinessId('CRN', 'SC123456', 'UK');
  assert.equal(validCrn.valid, true);
});

test('verifyBusinessOnboarding rejects incomplete details and accepts valid payload', () => {
  const rejected = verifyBusinessOnboarding({
    businessName: 'A',
    country: 'US',
    idType: 'EIN',
    idNumber: '12-3456789',
    registeredAddress: '123 Market St',
    beneficialOwnerName: 'Alice Smith',
    industryCategory: 'Apparel',
  });
  assert.equal(rejected.isValid, false);
  assert.equal(rejected.errorCode, 'INVALID_BUSINESS_NAME');

  const approved = verifyBusinessOnboarding({
    businessName: 'Nordic Craft Apparel Inc',
    country: 'US',
    idType: 'EIN',
    idNumber: '12-3456789',
    registeredAddress: '742 Evergreen Terrace, Springfield, OR',
    beneficialOwnerName: 'Jane Doe',
    industryCategory: 'Fashion & Apparel',
  });
  assert.equal(approved.isValid, true);
  assert.equal(approved.verificationBadge, 'VERIFIED_BUSINESS');
  assert.equal(approved.taxRegistryChecksumPassed, true);
});

test('enforceVerifiedMerchant strictly blocks unverified merchants', () => {
  const unverified: MerchantAccount = {
    merchantId: 'm_123',
    businessName: 'Unverified Shop',
    isVerified: false,
    tier: 'STANDARD',
    idNumber: '',
    country: 'US',
    createdAt: new Date().toISOString(),
  };

  const checkUnverified = enforceVerifiedMerchant(unverified);
  assert.equal(checkUnverified.allowed, false);
  assert.equal(checkUnverified.status, 403);

  const verified: MerchantAccount = {
    merchantId: 'm_456',
    businessName: 'Verified Premium Shop',
    isVerified: true,
    tier: 'PREMIUM',
    idNumber: '12-3456789',
    country: 'US',
    createdAt: new Date().toISOString(),
  };

  const checkVerified = enforceVerifiedMerchant(verified);
  assert.equal(checkVerified.allowed, true);
  assert.equal(checkVerified.status, 200);
});
