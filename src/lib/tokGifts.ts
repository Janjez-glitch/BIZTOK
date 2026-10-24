/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TokGiftItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  glowColor: string;
  badge: string;
  physicalItemDescription: string;
  estimatedWeightGrams: number;
  deliveryTimeframe: string;
}

export interface PhysicalGiftDispatchRecord {
  dispatchId: string;
  giftId: string;
  giftName: string;
  giftPrice: number;
  recipientCreatorId: string;
  recipientCreatorName: string;
  senderUserId: string;
  senderUserName: string;
  fulfillmentStatus: 'PENDING_SELLER_PACKAGING' | 'DISPATCHED_IN_TRANSIT' | 'DELIVERED';
  physicalItemDescription: string;
  redemptionToken: string;
  shippingAddress: string;
  assignedTrackingNumber?: string;
  dispatchedAt?: string;
  createdAt: string;
}

export const TOKGIFT_CATALOG: TokGiftItem[] = [
  {
    id: 'gift_coffee_bean',
    name: 'Coffee Bean Token',
    price: 4.50,
    icon: '☕',
    glowColor: '#f59e0b',
    badge: '100g Roast',
    physicalItemDescription: '100g Fresh Whole Bean Single-Origin Kyoto Roast',
    estimatedWeightGrams: 100,
    deliveryTimeframe: '2-3 Business Days',
  },
  {
    id: 'gift_mystery_bundle',
    name: 'Instant Mystery Bundle',
    price: 18.00,
    icon: '🎁',
    glowColor: '#00f2fe',
    badge: '3-Piece Set',
    physicalItemDescription: 'Curated 3-Item Desk & Studio Lifestyle Mystery Pack',
    estimatedWeightGrams: 350,
    deliveryTimeframe: '2-4 Business Days',
  },
  {
    id: 'gift_ceramic_tile',
    name: 'Ceramic Glaze Coaster',
    price: 8.50,
    icon: '🏺',
    glowColor: '#10b981',
    badge: 'Handmade',
    physicalItemDescription: 'Hand-thrown speckled stoneware coaster with cork backing',
    estimatedWeightGrams: 180,
    deliveryTimeframe: '2-3 Business Days',
  },
  {
    id: 'gift_express_luxury',
    name: 'Express Luxury Box',
    price: 45.00,
    icon: '✨',
    glowColor: '#ec4899',
    badge: 'Deluxe Hamper',
    physicalItemDescription: 'Premium matte black gift box with gold foil seal & collector item',
    estimatedWeightGrams: 800,
    deliveryTimeframe: 'Next Day Air Priority',
  },
  {
    id: 'gift_golden_ticket',
    name: 'VIP Golden Ticket',
    price: 75.00,
    icon: '👑',
    glowColor: '#eab308',
    badge: 'VIP Member',
    physicalItemDescription: 'Laser-engraved brass VIP membership ingot + lifetime store credit',
    estimatedWeightGrams: 250,
    deliveryTimeframe: 'Priority Registered Courier',
  },
];

/**
 * Sends a TokGift during a video or live broadcast.
 * Automatically spawns a corresponding PhysicalGiftDispatchRecord in the seller's fulfillment queue.
 */
export function sendTokGift(params: {
  giftId: string;
  recipientCreatorId: string;
  recipientCreatorName: string;
  senderUserId: string;
  senderUserName: string;
  customGiftNote?: string;
  shippingAddress?: string;
}): { success: boolean; dispatchRecord?: PhysicalGiftDispatchRecord; giftItem?: TokGiftItem; error?: string } {
  const giftItem = TOKGIFT_CATALOG.find(g => g.id === params.giftId);
  if (!giftItem) {
    return { success: false, error: `Invalid TokGift ID: ${params.giftId}` };
  }

  const dispatchId = `dispatch_gift_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;
  const redemptionToken = `TG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  const record: PhysicalGiftDispatchRecord = {
    dispatchId,
    giftId: giftItem.id,
    giftName: giftItem.name,
    giftPrice: giftItem.price,
    recipientCreatorId: params.recipientCreatorId,
    recipientCreatorName: params.recipientCreatorName,
    senderUserId: params.senderUserId,
    senderUserName: params.senderUserName,
    fulfillmentStatus: 'PENDING_SELLER_PACKAGING',
    physicalItemDescription: giftItem.physicalItemDescription,
    redemptionToken,
    shippingAddress: params.shippingAddress || 'Fulfillment Center Vault, Studio Bay 4, Austin TX',
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    dispatchRecord: record,
    giftItem,
  };
}

/**
 * Fulfills a physical gift dispatch by attaching courier tracking.
 */
export function dispatchPhysicalGift(
  record: PhysicalGiftDispatchRecord,
  trackingNumber: string
): PhysicalGiftDispatchRecord {
  return {
    ...record,
    fulfillmentStatus: 'DISPATCHED_IN_TRANSIT',
    assignedTrackingNumber: trackingNumber.trim().toUpperCase(),
    dispatchedAt: new Date().toISOString(),
  };
}
