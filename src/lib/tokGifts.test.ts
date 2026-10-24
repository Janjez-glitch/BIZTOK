import test from 'node:test';
import assert from 'node:assert/strict';
import { TOKGIFT_CATALOG, sendTokGift, dispatchPhysicalGift } from './tokGifts';

test('TOKGIFT_CATALOG contains the required gift items', () => {
  const coffee = TOKGIFT_CATALOG.find(g => g.name === 'Coffee Bean Token');
  assert.ok(coffee, 'Coffee Bean Token must exist');
  assert.equal(coffee.price, 4.50);

  const mystery = TOKGIFT_CATALOG.find(g => g.name === 'Instant Mystery Bundle');
  assert.ok(mystery, 'Instant Mystery Bundle must exist');

  const luxury = TOKGIFT_CATALOG.find(g => g.name === 'Express Luxury Box');
  assert.ok(luxury, 'Express Luxury Box must exist');
});

test('sendTokGift generates an automated physical dispatch order for seller fulfillment', () => {
  const result = sendTokGift({
    giftId: 'gift_coffee_bean',
    recipientCreatorId: 'merch_prime_1',
    recipientCreatorName: 'OrbitFlow Labs',
    senderUserId: 'user_fan_1',
    senderUserName: 'Sarah_Fan',
    shippingAddress: '452 Elm St, Seattle WA',
  });

  assert.equal(result.success, true);
  assert.ok(result.dispatchRecord);
  assert.equal(result.dispatchRecord.giftName, 'Coffee Bean Token');
  assert.equal(result.dispatchRecord.fulfillmentStatus, 'PENDING_SELLER_PACKAGING');
  assert.ok(result.dispatchRecord.redemptionToken.startsWith('TG-'));
  assert.equal(result.dispatchRecord.shippingAddress, '452 Elm St, Seattle WA');
});

test('dispatchPhysicalGift transitions status to DISPATCHED_IN_TRANSIT with tracking number', () => {
  const { dispatchRecord } = sendTokGift({
    giftId: 'gift_mystery_bundle',
    recipientCreatorId: 'merch_prime_1',
    recipientCreatorName: 'OrbitFlow Labs',
    senderUserId: 'user_fan_2',
    senderUserName: 'Alex_Buyer',
  });

  assert.ok(dispatchRecord);
  const dispatched = dispatchPhysicalGift(dispatchRecord, 'DHL-EXPRESS-9921');
  assert.equal(dispatched.fulfillmentStatus, 'DISPATCHED_IN_TRANSIT');
  assert.equal(dispatched.assignedTrackingNumber, 'DHL-EXPRESS-9921');
  assert.ok(dispatched.dispatchedAt);
});
