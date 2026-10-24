import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMPesaPhone,
  initiateMPesaSTKPush,
  createEscrowOrder,
  attachShippingTracking,
  releaseEscrowFunds,
} from './escrowEngine';

test('validateMPesaPhone correctly formats and verifies Kenyan/African mobile numbers', () => {
  const valid1 = validateMPesaPhone('254712345678');
  assert.equal(valid1.valid, true);
  assert.equal(valid1.formatted, '254712345678');

  const valid2 = validateMPesaPhone('0712345678');
  assert.equal(valid2.valid, true);
  assert.equal(valid2.formatted, '254712345678');

  const invalid = validateMPesaPhone('12345');
  assert.equal(invalid.valid, false);
});

test('initiateMPesaSTKPush returns checkout request ID on valid phone', () => {
  const res = initiateMPesaSTKPush({
    phoneNumber: '0712345678',
    amount: 49.0,
    orderId: 'ord_123',
    accountReference: 'BizTokOrder123',
  });
  assert.equal(res.responseCode, '0');
  assert.ok(res.checkoutRequestId.startsWith('ws_CO_'));
  assert.equal(res.isValidPhone, true);
});

test('createEscrowOrder locks funds in escrow upon payment creation', () => {
  const order = createEscrowOrder({
    orderId: 'ord_test_1',
    productId: 'prod_1',
    productTitle: 'OrbitFlow MagSafe Dock',
    amount: 100,
    buyerName: 'Alex Kim',
    buyerPhone: '254712345678',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    paymentMethod: 'MPESA_STK',
    paymentReference: 'MPESA_REF_99182',
    shippingAddress: '100 Silicon Way, Nairobi',
  });

  assert.equal(order.escrowStatus, 'FUNDS_LOCKED_IN_ESCROW');
  assert.equal(order.escrowHoldAmount, 100);
  assert.equal(order.platformFee, 5); // 5% fee
  assert.equal(order.merchantPayoutAmount, 95);
});

test('attachShippingTracking moves status to SHIPPED_TRACKING_GENERATED and validates minimum length', () => {
  const order = createEscrowOrder({
    orderId: 'ord_test_2',
    productId: 'prod_1',
    productTitle: 'OrbitFlow MagSafe Dock',
    amount: 100,
    buyerName: 'Alex Kim',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    paymentMethod: 'CARD',
    paymentReference: 'CH_123',
    shippingAddress: '200 Market St, SF',
  });

  // Short invalid tracking
  const badTrack = attachShippingTracking(order, 'SHORT');
  assert.equal(badTrack.success, false);

  // Valid tracking
  const goodTrack = attachShippingTracking(order, 'FDX-98234710', 'FedEx');
  assert.equal(goodTrack.success, true);
  assert.equal(goodTrack.updatedOrder.escrowStatus, 'SHIPPED_TRACKING_GENERATED');
  assert.equal(goodTrack.updatedOrder.trackingNumber, 'FDX-98234710');
});

test('releaseEscrowFunds only releases when tracking is attached', () => {
  const order = createEscrowOrder({
    orderId: 'ord_test_3',
    productId: 'prod_1',
    productTitle: 'OrbitFlow MagSafe Dock',
    amount: 100,
    buyerName: 'Alex Kim',
    sellerId: 'merch_prime_1',
    sellerName: 'OrbitFlow Labs',
    paymentMethod: 'CARD',
    paymentReference: 'CH_123',
    shippingAddress: '200 Market St, SF',
  });

  // Cannot release if tracking not generated yet
  const premature = releaseEscrowFunds(order);
  assert.equal(premature.success, false);

  // Attach tracking
  const { updatedOrder: shippedOrder } = attachShippingTracking(order, 'TRACK123456', 'DHL');
  const released = releaseEscrowFunds(shippedOrder);
  assert.equal(released.success, true);
  assert.equal(released.updatedOrder.escrowStatus, 'DELIVERED_ESCROW_RELEASED');
  assert.equal(released.updatedOrder.escrowHoldAmount, 0);
});
