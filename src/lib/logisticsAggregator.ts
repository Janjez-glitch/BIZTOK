/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MerchantAccount } from './businessVerification.js';
import { EscrowOrder } from './escrowEngine.js';

export type LogisticsTier = 'HYPER_LOCAL' | 'REGIONAL_SHUTTLE' | 'CROSS_BORDER';
export type DeliveryMethod = 'DOORSTEP' | 'PUDO_HUB';

export interface PudoLocation {
  id: string;
  name: string;
  category: 'PETROL_STATION' | 'SUPERMARKET' | 'P2P_DUKA' | 'PARCEL_LOCKER';
  brand: string;
  address: string;
  neighborhood: string;
  city: string;
  operatingHours: string;
  distanceKm: number;
  discountRate: number; // e.g. 0.25 (25% off delivery fee)
  partnerLogo: string;
  lat: number;
  lng: number;
}

export interface LogisticsProvider {
  id: string;
  name: string;
  tier: LogisticsTier;
  logo: string;
  badge: string;
  vehicleType: 'BODA_BODA' | 'TUK_TUK' | 'COURIER_VAN' | 'INTERCITY_BUS' | 'CARGO_FLIGHT';
  baseRateUsd: number;
  perKmRateUsd: number;
  estimatedTransitTime: string;
  etaMinutes: number;
  supportsLiveTracking: boolean;
  reliabilityScore: number; // 0 - 100
}

export interface LogisticsQuote {
  providerId: string;
  providerName: string;
  tier: LogisticsTier;
  vehicleType: string;
  badge: string;
  distanceKm: number;
  baseFare: number;
  distanceFare: number;
  pudoDiscount: number;
  totalDeliveryFee: number;
  estimatedTransitTime: string;
  etaMinutes: number;
  pickupWindow: string;
  deliveryMethod: DeliveryMethod;
  pudoHub?: PudoLocation;
}

export interface CourierDriver {
  driverId: string;
  name: string;
  phone: string;
  rating: number;
  totalTrips: number;
  vehiclePlate: string;
  vehicleModel: string;
  driverNationalId: string;
  avatarUrl: string;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
}

export interface ProofOfCondition {
  photoUrl: string;
  capturedAt: string;
  verifiedByDriverId: string;
  conditionStatus: 'SEALED_PRISTINE' | 'MINOR_EXTERNAL_WEAR' | 'RE_TAPED_INSPECTED';
  notes: string;
  gpsCoordinates: { lat: number; lng: number };
}

export type HandshakeStep =
  | 'ASSIGNED'
  | 'PICKUP_PIN_PENDING'
  | 'PICKUP_VERIFIED_IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_OTP_VERIFIED'
  | 'DELIVERED_PAYOUT_DISPATCHED';

export interface ShipmentHandshake {
  shipmentId: string;
  orderId: string;
  logisticsTier: LogisticsTier;
  deliveryMethod: DeliveryMethod;
  selectedProvider: string;
  trackingNumber: string;
  sellerPickupPin: string; // 4-digit PIN for seller
  buyerDeliveryOtp: string; // 6-digit OTP for buyer
  pudoHub?: PudoLocation;
  driver: CourierDriver;
  handshakeStep: HandshakeStep;
  proofOfCondition?: ProofOfCondition;
  pickupVerifiedAt?: string;
  deliveryVerifiedAt?: string;
  originAddress: string;
  destinationAddress: string;
  currentCoordinates: { lat: number; lng: number };
  targetCoordinates: { lat: number; lng: number };
  progressPercent: number;
  etaRemainingMinutes: number;
  automatedPayout?: AutomatedPayoutRecord;
  waybillNumber: string;
  createdAt: string;
}

export interface AutomatedPayoutRecord {
  orderId: string;
  merchantPayoutAmount: number;
  merchantName: string;
  riderDeliveryFee: number;
  riderName: string;
  riderMpesaPhone: string;
  riderMpesaReceipt: string;
  platformFee: number;
  disbursedAt: string;
  status: 'PENDING' | 'DISBURSED_SUCCESS';
}

export interface LegalWaybill {
  waybillNumber: string;
  orderId: string;
  createdAt: string;
  sellerBusinessName: string;
  sellerTaxId: string;
  sellerPermitNumber: string;
  sellerCountry: string;
  driverName: string;
  driverNationalId: string;
  driverPlate: string;
  carrierProvider: string;
  originAddress: string;
  destinationAddress: string;
  deliveryMethod: DeliveryMethod;
  declaredItemTitle: string;
  declaredValueUsd: number;
  packageWeightKg: number;
  legalNotice: string;
  qrPayload: string;
}

/* ========================================================================== */
/* SEED DATA & CONSTANTS                                                      */
/* ========================================================================== */

export const PUDO_HUBS: PudoLocation[] = [
  {
    id: 'pudo_total_westlands',
    name: 'TotalEnergies Service Station (Westlands Hub)',
    category: 'PETROL_STATION',
    brand: 'TotalEnergies',
    address: 'Waiyaki Way / Mpaka Rd Junction',
    neighborhood: 'Westlands',
    city: 'Nairobi',
    operatingHours: '24/7 Open',
    distanceKm: 2.4,
    discountRate: 0.25,
    partnerLogo: '⛽',
    lat: -1.2662,
    lng: 36.8041,
  },
  {
    id: 'pudo_quickmart_kilimani',
    name: 'QuickMart Supermarket Smart Parcel Locker',
    category: 'SUPERMARKET',
    brand: 'QuickMart',
    address: 'Argwings Kodhek Road, Kilimani',
    neighborhood: 'Kilimani',
    city: 'Nairobi',
    operatingHours: '6:00 AM - 11:00 PM',
    distanceKm: 1.8,
    discountRate: 0.25,
    partnerLogo: '🛒',
    lat: -1.2894,
    lng: 36.7836,
  },
  {
    id: 'pudo_shell_karen',
    name: 'Shell Karen Hub & Convenience Station',
    category: 'PETROL_STATION',
    brand: 'Shell',
    address: 'Karen Shopping Centre, Langata Rd',
    neighborhood: 'Karen',
    city: 'Nairobi',
    operatingHours: '24/7 Open',
    distanceKm: 8.5,
    discountRate: 0.20,
    partnerLogo: '🐚',
    lat: -1.3197,
    lng: 36.7065,
  },
  {
    id: 'pudo_mama_sarah_duka',
    name: "Mama Sarah's Community Duka & P2P Drop",
    category: 'P2P_DUKA',
    brand: 'Local Neighborhood Hub',
    address: 'Shop #14, Jamhuri Estate Avenue',
    neighborhood: 'Jamhuri / Woodley',
    city: 'Nairobi',
    operatingHours: '7:00 AM - 9:30 PM',
    distanceKm: 3.1,
    discountRate: 0.30,
    partnerLogo: '🏪',
    lat: -1.3045,
    lng: 36.7723,
  },
];

export const LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  // Hyper-Local Tier (Same-Day Intra-City)
  {
    id: 'prov_bolt_boda',
    name: 'Bolt Courier Boda Express',
    tier: 'HYPER_LOCAL',
    logo: '⚡',
    badge: 'Same-Day Fast (45m)',
    vehicleType: 'BODA_BODA',
    baseRateUsd: 2.80,
    perKmRateUsd: 0.45,
    estimatedTransitTime: '35 - 55 mins',
    etaMinutes: 45,
    supportsLiveTracking: true,
    reliabilityScore: 98,
  },
  {
    id: 'prov_uber_direct',
    name: 'Uber Direct On-Demand',
    tier: 'HYPER_LOCAL',
    logo: '🚗',
    badge: 'Same-Day Priority',
    vehicleType: 'COURIER_VAN',
    baseRateUsd: 4.50,
    perKmRateUsd: 0.65,
    estimatedTransitTime: '40 - 65 mins',
    etaMinutes: 50,
    supportsLiveTracking: true,
    reliabilityScore: 97,
  },
  {
    id: 'prov_glovo_courier',
    name: 'Glovo City Courier',
    tier: 'HYPER_LOCAL',
    logo: '🛵',
    badge: 'Ultra Fast',
    vehicleType: 'BODA_BODA',
    baseRateUsd: 3.20,
    perKmRateUsd: 0.50,
    estimatedTransitTime: '30 - 50 mins',
    etaMinutes: 38,
    supportsLiveTracking: true,
    reliabilityScore: 95,
  },

  // Regional Inter-City Tier (1-2 Days Highway Shuttle)
  {
    id: 'prov_easycoach_parcel',
    name: 'EasyCoach Regional Bus Parcel',
    tier: 'REGIONAL_SHUTTLE',
    logo: '🚌',
    badge: '1-2 Days Regional',
    vehicleType: 'INTERCITY_BUS',
    baseRateUsd: 6.50,
    perKmRateUsd: 0.08,
    estimatedTransitTime: '24 - 36 Hours',
    etaMinutes: 1440,
    supportsLiveTracking: true,
    reliabilityScore: 94,
  },
  {
    id: 'prov_modern_coast',
    name: 'Modern Coast Express Parcel',
    tier: 'REGIONAL_SHUTTLE',
    logo: '🚍',
    badge: 'Inter-City Overnight',
    vehicleType: 'INTERCITY_BUS',
    baseRateUsd: 7.20,
    perKmRateUsd: 0.09,
    estimatedTransitTime: '18 - 30 Hours',
    etaMinutes: 1200,
    supportsLiveTracking: true,
    reliabilityScore: 93,
  },
  {
    id: 'prov_2nk_shuttle',
    name: '2NK Express Shuttle P2P',
    tier: 'REGIONAL_SHUTTLE',
    logo: '🚐',
    badge: 'Same-Day Highway',
    vehicleType: 'COURIER_VAN',
    baseRateUsd: 8.00,
    perKmRateUsd: 0.12,
    estimatedTransitTime: '6 - 12 Hours',
    etaMinutes: 480,
    supportsLiveTracking: true,
    reliabilityScore: 91,
  },

  // Cross-Border Fallback Tier (3-5 Days Global)
  {
    id: 'prov_dhl_crossborder',
    name: 'DHL Express Cross-Border',
    tier: 'CROSS_BORDER',
    logo: '✈️',
    badge: 'International Air',
    vehicleType: 'CARGO_FLIGHT',
    baseRateUsd: 26.00,
    perKmRateUsd: 0.20,
    estimatedTransitTime: '3 - 5 Days',
    etaMinutes: 4320,
    supportsLiveTracking: true,
    reliabilityScore: 99,
  },
  {
    id: 'prov_fedex_intl',
    name: 'FedEx Global Priority',
    tier: 'CROSS_BORDER',
    logo: '📦',
    badge: 'Global Express',
    vehicleType: 'CARGO_FLIGHT',
    baseRateUsd: 28.50,
    perKmRateUsd: 0.22,
    estimatedTransitTime: '3 - 4 Days',
    etaMinutes: 3800,
    supportsLiveTracking: true,
    reliabilityScore: 98,
  },
];

export const MOCK_DRIVERS: CourierDriver[] = [
  {
    driverId: 'drv_juma_boda',
    name: 'Juma Omondi',
    phone: '+254 722 994 102',
    rating: 4.94,
    totalTrips: 1842,
    vehiclePlate: 'KME 489T',
    vehicleModel: 'Yamaha Boxer 150 (Black/Neon)',
    driverNationalId: 'ID-28491024',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    currentLat: -1.2825,
    currentLng: 36.8155,
    speedKmh: 34,
  },
  {
    driverId: 'drv_wambui_van',
    name: 'Faith Wambui',
    phone: '+254 711 558 390',
    rating: 4.98,
    totalTrips: 2190,
    vehiclePlate: 'KDH 814X',
    vehicleModel: 'Toyota HiAce Electric Courier',
    driverNationalId: 'ID-31298412',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    currentLat: -1.2750,
    currentLng: 36.8020,
    speedKmh: 42,
  },
  {
    driverId: 'drv_hassan_bus',
    name: 'Hassan Kiprono',
    phone: '+254 733 812 770',
    rating: 4.89,
    totalTrips: 3410,
    vehiclePlate: 'KDA 309L',
    vehicleModel: 'Scania InterCity Coach #42',
    driverNationalId: 'ID-24519033',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    currentLat: -1.2980,
    currentLng: 36.8320,
    speedKmh: 58,
  },
];

/* ========================================================================== */
/* PURE CALCULATION & ENGINE LOGIC                                            */
/* ========================================================================== */

/**
 * Calculates geographic distance in kilometers between two lat/lng points
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Derives approximate distance in KM based on address strings
 * if GPS coordinates are not explicitly passed.
 */
export function estimateDistanceBetweenAddresses(
  originAddress: string,
  destinationAddress: string
): number {
  const normDest = (destinationAddress || '').toLowerCase();
  const normOrig = (originAddress || '').toLowerCase();

  // Cross-border detection
  if (
    normDest.includes('usa') ||
    normDest.includes('united states') ||
    normDest.includes('uk') ||
    normDest.includes('london') ||
    normDest.includes('berlin') ||
    normDest.includes('tokyo') ||
    normOrig.includes('kyoto')
  ) {
    return 7400; // Intercontinental
  }

  // Regional inter-city detection
  if (
    normDest.includes('mombasa') ||
    normDest.includes('kisumu') ||
    normDest.includes('nakuru') ||
    normDest.includes('eldoret') ||
    normDest.includes('kampala') ||
    normDest.includes('arusha')
  ) {
    if (normDest.includes('mombasa')) return 485;
    if (normDest.includes('kisumu')) return 350;
    if (normDest.includes('nakuru')) return 160;
    if (normDest.includes('kampala')) return 650;
    return 280;
  }

  // Hyper-local intra-city distance approximation
  if (normDest.includes('westlands')) return 3.2;
  if (normDest.includes('karen')) return 14.5;
  if (normDest.includes('kilimani')) return 4.8;
  if (normDest.includes('cbd') || normDest.includes('central')) return 2.1;
  if (normDest.includes('runda')) return 11.2;
  if (normDest.includes('langata')) return 9.4;

  // Default intra-city average distance
  return 6.5;
}

/**
 * Upfront Pricing Engine: Calculates dynamic, fixed logistics quotes
 * across Hyper-local, Regional, and Cross-Border tiers.
 * If PUDO_HUB is chosen, applies the hub's discount rate.
 */
export function calculateLogisticsQuotes(params: {
  originAddress: string;
  destinationAddress: string;
  deliveryMethod: DeliveryMethod;
  selectedPudoId?: string;
  packageWeightKg?: number;
}): LogisticsQuote[] {
  const weightKg = params.packageWeightKg || 1.2;
  const distanceKm = estimateDistanceBetweenAddresses(
    params.originAddress,
    params.destinationAddress
  );

  const selectedPudo = params.selectedPudoId
    ? PUDO_HUBS.find(h => h.id === params.selectedPudoId)
    : PUDO_HUBS[0];

  return LOGISTICS_PROVIDERS.map(prov => {
    // Determine effective distance for this tier
    let effectiveKm = distanceKm;
    if (prov.tier === 'HYPER_LOCAL' && distanceKm > 35) {
      // Force higher distance warning or bump
      effectiveKm = Math.min(distanceKm, 35);
    }

    const base = prov.baseRateUsd;
    const distanceCost = Number((effectiveKm * prov.perKmRateUsd).toFixed(2));
    const weightSurcharge = weightKg > 2.0 ? Number(((weightKg - 2.0) * 1.5).toFixed(2)) : 0;
    const rawTotal = base + distanceCost + weightSurcharge;

    let discount = 0;
    if (params.deliveryMethod === 'PUDO_HUB' && selectedPudo) {
      discount = Number((rawTotal * selectedPudo.discountRate).toFixed(2));
    }

    const totalFee = Number(Math.max(1.50, rawTotal - discount).toFixed(2));

    let transitTime = prov.estimatedTransitTime;
    let etaMins = prov.etaMinutes;

    if (prov.tier === 'HYPER_LOCAL') {
      etaMins = Math.max(25, Math.round(distanceKm * 5 + 15));
      transitTime = `${etaMins - 10} - ${etaMins + 15} mins`;
    }

    return {
      providerId: prov.id,
      providerName: prov.name,
      tier: prov.tier,
      vehicleType: prov.vehicleType,
      badge: prov.badge,
      distanceKm: effectiveKm,
      baseFare: base,
      distanceFare: distanceCost,
      pudoDiscount: discount,
      totalDeliveryFee: totalFee,
      estimatedTransitTime: transitTime,
      etaMinutes: etaMins,
      pickupWindow: 'Within 20 mins of payment authorization',
      deliveryMethod: params.deliveryMethod,
      pudoHub: params.deliveryMethod === 'PUDO_HUB' ? selectedPudo : undefined,
    };
  });
}

/**
 * Creates initial 3-way handshake credentials for an escrow order.
 * Generates:
 * - 4-digit Seller Pickup PIN (e.g. 4821)
 * - 6-digit Buyer Delivery OTP (e.g. 749210)
 * - Verifiable tracking code & digital waybill number
 */
export function generateHandshakeCredentials(params: {
  orderId: string;
  tier: LogisticsTier;
  deliveryMethod: DeliveryMethod;
  providerId: string;
  originAddress: string;
  destinationAddress: string;
  pudoId?: string;
}): ShipmentHandshake {
  const seed = Date.now();
  const sellerPin = String(Math.floor(1000 + Math.random() * 9000));
  const buyerOtp = String(Math.floor(100000 + Math.random() * 900000));
  const prefix = params.tier === 'HYPER_LOCAL' ? 'BOD' : params.tier === 'REGIONAL_SHUTTLE' ? 'BUS' : 'DHL';
  const trackingNumber = `${prefix}-${seed.toString().slice(-6)}`;
  const waybillNumber = `WB-2025-${prefix}-${seed.toString().slice(-5)}`;

  const pudo = params.pudoId ? PUDO_HUBS.find(h => h.id === params.pudoId) : undefined;
  const driver = MOCK_DRIVERS[0];

  return {
    shipmentId: `shp_${seed}`,
    orderId: params.orderId,
    logisticsTier: params.tier,
    deliveryMethod: params.deliveryMethod,
    selectedProvider: params.providerId,
    trackingNumber,
    sellerPickupPin: sellerPin,
    buyerDeliveryOtp: buyerOtp,
    pudoHub: pudo,
    driver,
    handshakeStep: 'PICKUP_PIN_PENDING',
    originAddress: params.originAddress,
    destinationAddress: params.deliveryMethod === 'PUDO_HUB' && pudo ? `${pudo.name}, ${pudo.address}` : params.destinationAddress,
    currentCoordinates: { lat: -1.2825, lng: 36.8155 },
    targetCoordinates: pudo ? { lat: pudo.lat, lng: pudo.lng } : { lat: -1.2921, lng: 36.8219 },
    progressPercent: 15,
    etaRemainingMinutes: 35,
    waybillNumber,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Step 1 of Digital Handshake:
 * When the driver arrives at the seller's premises to collect the package,
 * the seller provides their 4-digit PIN (or driver scans seller QR).
 * Driver snaps a Proof of Condition photo to seal package integrity before departure.
 */
export function verifySellerPickupHandshake(params: {
  shipment: ShipmentHandshake;
  enteredPin: string;
  conditionNotes?: string;
  photoUrl?: string;
}): {
  success: boolean;
  updatedShipment: ShipmentHandshake;
  message: string;
  errorCode?: string;
} {
  const { shipment, enteredPin, conditionNotes, photoUrl } = params;

  if (shipment.handshakeStep !== 'PICKUP_PIN_PENDING') {
    return {
      success: false,
      updatedShipment: shipment,
      message: `Invalid state: Shipment is already in '${shipment.handshakeStep}'.`,
      errorCode: 'INVALID_STEP',
    };
  }

  if (enteredPin.trim() !== shipment.sellerPickupPin) {
    return {
      success: false,
      updatedShipment: shipment,
      message: 'Incorrect Seller Pickup PIN. Please check the 4-digit PIN in your Seller Dispatch Terminal.',
      errorCode: 'PIN_MISMATCH',
    };
  }

  const proof: ProofOfCondition = {
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    capturedAt: new Date().toISOString(),
    verifiedByDriverId: shipment.driver.driverId,
    conditionStatus: 'SEALED_PRISTINE',
    notes: conditionNotes || 'Sealed tamper-evident BizTok packaging verified pristine by rider upon pickup.',
    gpsCoordinates: { ...shipment.currentCoordinates },
  };

  const updated: ShipmentHandshake = {
    ...shipment,
    handshakeStep: 'PICKUP_VERIFIED_IN_TRANSIT',
    proofOfCondition: proof,
    pickupVerifiedAt: new Date().toISOString(),
    progressPercent: 50,
    etaRemainingMinutes: Math.max(10, shipment.etaRemainingMinutes - 15),
  };

  return {
    success: true,
    updatedShipment: updated,
    message: `3-Way Handshake Step 1 Verified! Package collected by ${shipment.driver.name} (${shipment.driver.vehiclePlate}). Proof of condition logged. Package is officially IN TRANSIT.`,
  };
}

/**
 * Step 2 of Digital Handshake:
 * Driver arrives at buyer's location (or PUDO hub).
 * Package CANNOT be released until buyer provides their 6-digit Delivery OTP.
 * When verified:
 *  - Escrow funds released to Seller
 *  - Delivery fee disbursed instantly to Rider via M-Pesa B2C
 */
export function verifyBuyerDeliveryHandshake(params: {
  shipment: ShipmentHandshake;
  enteredOtp: string;
  escrowOrder?: EscrowOrder;
  deliveryFee?: number;
}): {
  success: boolean;
  updatedShipment: ShipmentHandshake;
  payoutRecord?: AutomatedPayoutRecord;
  message: string;
  errorCode?: string;
} {
  const { shipment, enteredOtp, escrowOrder, deliveryFee = 4.50 } = params;

  if (
    shipment.handshakeStep !== 'PICKUP_VERIFIED_IN_TRANSIT' &&
    shipment.handshakeStep !== 'OUT_FOR_DELIVERY'
  ) {
    return {
      success: false,
      updatedShipment: shipment,
      message: `Cannot verify delivery OTP: Shipment must be in transit (Current step: ${shipment.handshakeStep}).`,
      errorCode: 'NOT_IN_TRANSIT',
    };
  }

  if (enteredOtp.trim() !== shipment.buyerDeliveryOtp) {
    return {
      success: false,
      updatedShipment: shipment,
      message: 'Invalid Delivery OTP! The driver cannot hand over the parcel until the exact 6-digit OTP matches.',
      errorCode: 'OTP_MISMATCH',
    };
  }

  const mpesaReceipt = `MPESA_B2C_RIDER_${Date.now().toString().slice(-6)}`;
  const merchantPayout = escrowOrder ? escrowOrder.merchantPayoutAmount : 46.55;
  const sellerName = escrowOrder ? escrowOrder.sellerName : 'Nordic Clayworks & Design Inc';

  const payout: AutomatedPayoutRecord = {
    orderId: shipment.orderId,
    merchantPayoutAmount: merchantPayout,
    merchantName: sellerName,
    riderDeliveryFee: deliveryFee,
    riderName: shipment.driver.name,
    riderMpesaPhone: shipment.driver.phone,
    riderMpesaReceipt: mpesaReceipt,
    platformFee: escrowOrder ? escrowOrder.platformFee : 2.45,
    disbursedAt: new Date().toISOString(),
    status: 'DISBURSED_SUCCESS',
  };

  const updated: ShipmentHandshake = {
    ...shipment,
    handshakeStep: 'DELIVERED_PAYOUT_DISPATCHED',
    deliveryVerifiedAt: new Date().toISOString(),
    progressPercent: 100,
    etaRemainingMinutes: 0,
    automatedPayout: payout,
  };

  return {
    success: true,
    updatedShipment: updated,
    payoutRecord: payout,
    message: `🎉 Delivery OTP Confirmed! Parcel successfully released to buyer. Automated Split Payout executed: $${merchantPayout} released to ${sellerName} & $${deliveryFee} delivery fee sent via M-Pesa B2C (${mpesaReceipt}) to driver ${shipment.driver.name}.`,
  };
}

/**
 * Auto-generates a Legal Printable/Scannable Digital Waybill
 * using verified merchant business registration permits & driver IDs.
 */
export function generateLegalWaybill(params: {
  merchant: MerchantAccount;
  shipment: ShipmentHandshake;
  declaredItemTitle: string;
  declaredValueUsd: number;
  packageWeightKg?: number;
}): LegalWaybill {
  const { merchant, shipment, declaredItemTitle, declaredValueUsd, packageWeightKg = 1.4 } = params;

  const qrPayload = JSON.stringify({
    wb: shipment.waybillNumber,
    ord: shipment.orderId,
    tax: merchant.idNumber || 'TAX-NOT-PROVIDED',
    lic: merchant.merchantId,
    drv: shipment.driver.driverNationalId,
    plt: shipment.driver.vehiclePlate,
    val: declaredValueUsd,
    ts: shipment.createdAt,
    hash: `BIZTOK-SEC-${shipment.waybillNumber.slice(-4)}-VERIFIED`,
  });

  return {
    waybillNumber: shipment.waybillNumber,
    orderId: shipment.orderId,
    createdAt: shipment.createdAt,
    sellerBusinessName: merchant.businessName,
    sellerTaxId: merchant.idNumber || 'VERIFIED-REG-TAX-ID',
    sellerPermitNumber: `BP-PERMIT-${merchant.merchantId.toUpperCase()}-2025`,
    sellerCountry: merchant.country,
    driverName: shipment.driver.name,
    driverNationalId: shipment.driver.driverNationalId,
    driverPlate: shipment.driver.vehiclePlate,
    carrierProvider: shipment.selectedProvider,
    originAddress: shipment.originAddress,
    destinationAddress: shipment.destinationAddress,
    deliveryMethod: shipment.deliveryMethod,
    declaredItemTitle,
    declaredValueUsd,
    packageWeightKg,
    legalNotice:
      'Under the BizTok Digital Marketplace Escrow Act & Regional Transport Mandate, this waybill binds the registered merchant permit and vetted courier operator to total legal accountability. Delivery is only perfected upon the cryptographic 3-Way OTP Digital Handshake.',
    qrPayload,
  };
}

/**
 * Simulates real-time rider GPS movement along a vector
 * for the live TikTok-style order tracking map.
 */
export function simulateRiderMovement(
  current: { lat: number; lng: number },
  target: { lat: number; lng: number },
  stepRatio = 0.15
): { lat: number; lng: number; headingDegrees: number } {
  const newLat = Number((current.lat + (target.lat - current.lat) * stepRatio).toFixed(5));
  const newLng = Number((current.lng + (target.lng - current.lng) * stepRatio).toFixed(5));

  // Compute heading degrees
  const dy = target.lat - current.lat;
  const dx = target.lng - current.lng;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  return {
    lat: newLat,
    lng: newLng,
    headingDegrees: Math.round(angle),
  };
}
