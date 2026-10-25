/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineDistanceKm,
  estimateDistanceBetweenAddresses,
  calculateLogisticsQuotes,
  generateHandshakeCredentials,
  verifySellerPickupHandshake,
  verifyBuyerDeliveryHandshake,
  generateLegalWaybill,
  simulateRiderMovement,
  PUDO_HUBS,
  LOGISTICS_PROVIDERS,
} from './logisticsAggregator.js';
import { MerchantAccount } from './businessVerification.js';
import { EscrowOrder } from './escrowEngine.js';

test('Haversine distance calculates accurate kilometers between geo coordinates', () => {
  // Nairobi Westlands (-1.2662, 36.8041) to Kilimani (-1.2894, 36.7836) ~ 3.4 km
  const dist = calculateHaversineDistanceKm(-1.2662, 36.8041, -1.2894, 36.7836);
  assert.ok(dist >= 3.0 && dist <= 4.0, `Expected distance between 3.0 and 4.0km, got ${dist}`);
});

test('estimateDistanceBetweenAddresses correctly categorizes intra-city vs regional vs cross-border', () => {
  const localDist = estimateDistanceBetweenAddresses('Nairobi CBD', 'Westlands, Nairobi');
  assert.equal(localDist, 3.2);

  const regionalDist = estimateDistanceBetweenAddresses('Nairobi CBD', 'Mombasa Port Cargo Depot');
  assert.equal(regionalDist, 485);

  const crossBorderDist = estimateDistanceBetweenAddresses('Nairobi Hub', '742 Evergreen Terrace, Portland, USA');
  assert.equal(crossBorderDist, 7400);
});

test('calculateLogisticsQuotes generates quotes across all 3 tiers with PUDO discount applied', () => {
  const quotesDoorstep = calculateLogisticsQuotes({
    originAddress: 'Nairobi Innovation Hub',
    destinationAddress: 'Westlands, Nairobi',
    deliveryMethod: 'DOORSTEP',
  });

  assert.ok(quotesDoorstep.length >= 6);
  const hyperLocalBolt = quotesDoorstep.find(q => q.providerId === 'prov_bolt_boda');
  assert.ok(hyperLocalBolt);
  assert.equal(hyperLocalBolt.tier, 'HYPER_LOCAL');
  assert.equal(hyperLocalBolt.pudoDiscount, 0);

  // When PUDO is selected, verify discount is applied
  const quotesPudo = calculateLogisticsQuotes({
    originAddress: 'Nairobi Innovation Hub',
    destinationAddress: 'Westlands, Nairobi',
    deliveryMethod: 'PUDO_HUB',
    selectedPudoId: PUDO_HUBS[0].id, // 25% discount
  });

  const pudoBolt = quotesPudo.find(q => q.providerId === 'prov_bolt_boda');
  assert.ok(pudoBolt);
  assert.ok(pudoBolt.pudoDiscount > 0);
  assert.ok(pudoBolt.totalDeliveryFee < hyperLocalBolt.totalDeliveryFee);
  assert.ok(pudoBolt.pudoHub !== undefined);
});

test('3-Way Digital Handshake lifecycle: generates credentials, verifies seller PIN with proof photo, and verifies buyer OTP with split payout', () => {
  // 1. Generate credentials
  const shipment = generateHandshakeCredentials({
    orderId: 'ord_escrow_101',
    tier: 'HYPER_LOCAL',
    deliveryMethod: 'DOORSTEP',
    providerId: 'prov_bolt_boda',
    originAddress: 'Seller Workshop, Kilimani',
    destinationAddress: 'Buyer Residence, Westlands',
  });

  assert.equal(shipment.handshakeStep, 'PICKUP_PIN_PENDING');
  assert.equal(shipment.sellerPickupPin.length, 4);
  assert.equal(shipment.buyerDeliveryOtp.length, 6);
  assert.ok(shipment.waybillNumber.startsWith('WB-2025-'));

  // 2. Reject incorrect pickup PIN
  const wrongPinRes = verifySellerPickupHandshake({
    shipment,
    enteredPin: '0000',
  });
  assert.equal(wrongPinRes.success, false);
  assert.equal(wrongPinRes.errorCode, 'PIN_MISMATCH');

  // 3. Accept correct pickup PIN & log proof-of-condition photo
  const correctPinRes = verifySellerPickupHandshake({
    shipment,
    enteredPin: shipment.sellerPickupPin,
    conditionNotes: 'Box sealed with security hologram stamp.',
  });
  assert.equal(correctPinRes.success, true);
  assert.equal(correctPinRes.updatedShipment.handshakeStep, 'PICKUP_VERIFIED_IN_TRANSIT');
  assert.ok(correctPinRes.updatedShipment.proofOfCondition);
  assert.equal(correctPinRes.updatedShipment.proofOfCondition?.conditionStatus, 'SEALED_PRISTINE');

  // 4. Reject incorrect buyer Delivery OTP
  const inTransitShipment = correctPinRes.updatedShipment;
  const wrongOtpRes = verifyBuyerDeliveryHandshake({
    shipment: inTransitShipment,
    enteredOtp: '123456',
  });
  assert.equal(wrongOtpRes.success, false);
  assert.equal(wrongOtpRes.errorCode, 'OTP_MISMATCH');

  // 5. Accept correct buyer Delivery OTP & execute automated split payout
  const mockEscrowOrder: EscrowOrder = {
    orderId: 'ord_escrow_101',
    productId: 'prod_orbit_magsafe',
    productTitle: 'OrbitFlow Dock',
    amount: 49.00,
    currency: 'USD',
    buyerId: 'buyer_1',
    buyerName: 'Alex Mwangi',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    paymentMethod: 'MPESA_STK',
    paymentReference: 'MPESA_REF_1',
    escrowStatus: 'SHIPPED_TRACKING_GENERATED',
    escrowHoldAmount: 49.00,
    platformFee: 2.45,
    merchantPayoutAmount: 46.55,
    shippingAddress: 'Nairobi',
    createdAt: new Date().toISOString(),
  };

  const correctOtpRes = verifyBuyerDeliveryHandshake({
    shipment: inTransitShipment,
    enteredOtp: inTransitShipment.buyerDeliveryOtp,
    escrowOrder: mockEscrowOrder,
    deliveryFee: 4.25,
  });

  assert.equal(correctOtpRes.success, true);
  assert.equal(correctOtpRes.updatedShipment.handshakeStep, 'DELIVERED_PAYOUT_DISPATCHED');
  assert.ok(correctOtpRes.payoutRecord);
  assert.equal(correctOtpRes.payoutRecord?.merchantPayoutAmount, 46.55);
  assert.equal(correctOtpRes.payoutRecord?.riderDeliveryFee, 4.25);
  assert.ok(correctOtpRes.payoutRecord?.riderMpesaReceipt.startsWith('MPESA_B2C_RIDER_'));
});

test('generateLegalWaybill binds verified business permit and driver credentials into printable waybill', () => {
  const mockMerchant: MerchantAccount = {
    merchantId: 'merch_prime_1',
    businessName: 'Nordic Clayworks & Design Inc',
    isVerified: true,
    tier: 'PREMIUM',
    idNumber: '12-3456789 (US EIN)',
    country: 'US',
    createdAt: new Date().toISOString(),
  };

  const shipment = generateHandshakeCredentials({
    orderId: 'ord_escrow_101',
    tier: 'HYPER_LOCAL',
    deliveryMethod: 'DOORSTEP',
    providerId: 'prov_bolt_boda',
    originAddress: 'Studio Kilimani',
    destinationAddress: 'Tech Tower, Nairobi',
  });

  const waybill = generateLegalWaybill({
    merchant: mockMerchant,
    shipment,
    declaredItemTitle: 'OrbitFlow 3-in-1 Foldable MagSafe Dock',
    declaredValueUsd: 49.00,
    packageWeightKg: 0.85,
  });

  assert.equal(waybill.sellerTaxId, '12-3456789 (US EIN)');
  assert.equal(waybill.sellerBusinessName, 'Nordic Clayworks & Design Inc');
  assert.ok(waybill.qrPayload.includes('BIZTOK-SEC-'));
  assert.ok(waybill.qrPayload.includes(mockMerchant.idNumber));
});

test('simulateRiderMovement smoothly interpolates coordinates along delivery vector', () => {
  const current = { lat: -1.2800, lng: 36.8100 };
  const target = { lat: -1.2600, lng: 36.8300 };

  const moved = simulateRiderMovement(current, target, 0.20);
  assert.ok(moved.lat > current.lat);
  assert.ok(moved.lng > current.lng);
  assert.ok(moved.headingDegrees >= 0 && moved.headingDegrees <= 360);
});
