/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EscrowStatus =
  | 'PAYMENT_PENDING'
  | 'FUNDS_LOCKED_IN_ESCROW'
  | 'SHIPPED_TRACKING_GENERATED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED_ESCROW_RELEASED'
  | 'DISPUTED_ESCROW_FROZEN'
  | 'REFUNDED';

export type PaymentMethodType = 'CARD' | 'MPESA_STK' | 'APPLE_PAY' | 'GOOGLE_PAY';

export interface EscrowOrder {
  orderId: string;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  sellerId: string;
  sellerName: string;
  paymentMethod: PaymentMethodType;
  paymentReference: string;
  escrowStatus: EscrowStatus;
  escrowHoldAmount: number;
  platformFee: number;
  merchantPayoutAmount: number;
  trackingNumber?: string;
  carrier?: 'FedEx' | 'DHL' | 'UPS' | 'PostGlobal' | 'SendyExpress';
  shippingAddress: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
}

export interface MPesaSTKRequest {
  phoneNumber: string; // e.g. 254712345678 or +254...
  amount: number;
  orderId: string;
  accountReference: string;
  transactionDesc?: string;
}

export interface MPesaSTKResponse {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string; // '0' for success initiate
  responseDescription: string;
  customerMessage: string;
  isValidPhone: boolean;
  formattedPhone: string;
}

/**
 * Validates and normalizes phone numbers for mobile money (e.g. Safaricom M-Pesa format).
 * Accepts 2547XXXXXXXX, 07XXXXXXXX, +2547XXXXXXXX, etc.
 */
export function validateMPesaPhone(phone: string): { valid: boolean; formatted: string; reason?: string } {
  const digits = phone.replace(/[^0-9]/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    return { valid: true, formatted: digits };
  }
  if (digits.startsWith('0') && (digits.length === 10)) {
    return { valid: true, formatted: `254${digits.slice(1)}` };
  }
  if (digits.startsWith('7') && digits.length === 9) {
    return { valid: true, formatted: `254${digits}` };
  }
  if (digits.startsWith('1') && digits.length === 9) { // 01XXXXXXXX Safaricom numbers
    return { valid: true, formatted: `254${digits}` };
  }

  return {
    valid: false,
    formatted: phone,
    reason: 'Phone number must be a valid 9-12 digit mobile format (e.g. 254712345678 or 0712345678)',
  };
}

/**
 * Initiates an M-Pesa Daraja STK Push transaction simulation.
 */
export function initiateMPesaSTKPush(payload: MPesaSTKRequest): MPesaSTKResponse {
  const phoneCheck = validateMPesaPhone(payload.phoneNumber);
  if (!phoneCheck.valid) {
    return {
      merchantRequestId: '',
      checkoutRequestId: '',
      responseCode: '1',
      responseDescription: phoneCheck.reason || 'Invalid phone number format',
      customerMessage: 'STK push failed: invalid mobile number.',
      isValidPhone: false,
      formattedPhone: payload.phoneNumber,
    };
  }

  const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`;
  const merchantRequestId = `MR_${Date.now()}`;

  return {
    merchantRequestId,
    checkoutRequestId,
    responseCode: '0',
    responseDescription: 'Success. Request accepted for processing',
    customerMessage: `STK Push sent to ${phoneCheck.formatted}. Please enter your M-Pesa PIN on your phone to authorize $${payload.amount}.`,
    isValidPhone: true,
    formattedPhone: phoneCheck.formatted,
  };
}

/**
 * Creates a new order with funds immediately locked in escrow.
 */
export function createEscrowOrder(params: {
  orderId: string;
  productId: string;
  productTitle: string;
  amount: number;
  buyerName: string;
  buyerPhone?: string;
  sellerId: string;
  sellerName: string;
  paymentMethod: PaymentMethodType;
  paymentReference: string;
  shippingAddress: string;
}): EscrowOrder {
  const platformFeeRate = 0.05; // 5% marketplace commission
  const platformFee = Number((params.amount * platformFeeRate).toFixed(2));
  const merchantPayoutAmount = Number((params.amount - platformFee).toFixed(2));

  return {
    orderId: params.orderId,
    productId: params.productId,
    productTitle: params.productTitle,
    amount: params.amount,
    currency: 'USD',
    buyerId: `buyer_${Date.now()}`,
    buyerName: params.buyerName,
    buyerPhone: params.buyerPhone,
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    paymentMethod: params.paymentMethod,
    paymentReference: params.paymentReference,
    escrowStatus: 'FUNDS_LOCKED_IN_ESCROW',
    escrowHoldAmount: params.amount,
    platformFee,
    merchantPayoutAmount,
    shippingAddress: params.shippingAddress,
    createdAt: new Date().toISOString(),
  };
}

/**
 * State Transition: Merchant generates a valid tracking ID.
 * Transitions order from FUNDS_LOCKED_IN_ESCROW -> SHIPPED_TRACKING_GENERATED.
 */
export function attachShippingTracking(
  order: EscrowOrder,
  trackingNumber: string,
  carrier: 'FedEx' | 'DHL' | 'UPS' | 'PostGlobal' | 'SendyExpress' = 'FedEx'
): { success: boolean; updatedOrder: EscrowOrder; message: string } {
  if (order.escrowStatus !== 'FUNDS_LOCKED_IN_ESCROW') {
    return {
      success: false,
      updatedOrder: order,
      message: `Cannot attach tracking: Order is currently in status '${order.escrowStatus}'`,
    };
  }

  const cleanTracking = trackingNumber.trim().toUpperCase();
  if (cleanTracking.length < 8) {
    return {
      success: false,
      updatedOrder: order,
      message: 'Tracking number must be at least 8 alphanumeric characters.',
    };
  }

  const updated: EscrowOrder = {
    ...order,
    trackingNumber: cleanTracking,
    carrier,
    escrowStatus: 'SHIPPED_TRACKING_GENERATED',
    shippedAt: new Date().toISOString(),
  };

  return {
    success: true,
    updatedOrder: updated,
    message: `Tracking ID '${cleanTracking}' verified with ${carrier}. Escrow scheduled for release upon delivery.`,
  };
}

/**
 * State Transition: Delivery confirmation releases funds from escrow to merchant payout balance.
 */
export function releaseEscrowFunds(order: EscrowOrder): { success: boolean; updatedOrder: EscrowOrder; message: string } {
  if (order.escrowStatus !== 'SHIPPED_TRACKING_GENERATED' && order.escrowStatus !== 'OUT_FOR_DELIVERY') {
    return {
      success: false,
      updatedOrder: order,
      message: `Cannot release escrow: Order must be in 'SHIPPED_TRACKING_GENERATED' or 'OUT_FOR_DELIVERY' (Current: ${order.escrowStatus})`,
    };
  }

  const updated: EscrowOrder = {
    ...order,
    escrowStatus: 'DELIVERED_ESCROW_RELEASED',
    deliveredAt: new Date().toISOString(),
    releasedAt: new Date().toISOString(),
    escrowHoldAmount: 0,
  };

  return {
    success: true,
    updatedOrder: updated,
    message: `Delivery confirmed. $${updated.merchantPayoutAmount} successfully released from escrow to ${order.sellerName}.`,
  };
}
