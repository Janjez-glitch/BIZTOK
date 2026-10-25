/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  QrCode,
  Lock,
  CheckCircle2,
  AlertCircle,
  Camera,
  DollarSign,
  FileText,
  Navigation,
  RefreshCw,
  ExternalLink,
  Zap,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  Store,
  Compass
} from 'lucide-react';
import {
  ShipmentHandshake,
  PudoLocation,
  LogisticsQuote,
  PUDO_HUBS,
  LOGISTICS_PROVIDERS
} from '../lib/logisticsAggregator';

interface LogisticsHubModalProps {
  onClose: () => void;
  selectedOrderId?: string;
  onShipmentDelivered?: () => void;
}

export function LogisticsHubModal({
  onClose,
  selectedOrderId,
  onShipmentDelivered,
}: LogisticsHubModalProps) {
  const [shipments, setShipments] = useState<ShipmentHandshake[]>([]);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'TRACKER' | 'HANDSHAKE' | 'WAYBILL' | 'PUDO'>('TRACKER');

  // Handshake terminal states
  const [sellerPinInput, setSellerPinInput] = useState('');
  const [buyerOtpInput, setBuyerOtpInput] = useState('');
  const [conditionNotesInput, setConditionNotesInput] = useState('Packaging intact with tamper seal verified.');
  const [handshakeMessage, setHandshakeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Waybill state
  const [waybillData, setWaybillData] = useState<any | null>(null);

  // Auto-drive simulation timer
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  // Fetch all shipments
  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/logistics/shipments');
      const data = await res.json();
      if (data.shipments && data.shipments.length > 0) {
        setShipments(data.shipments);
        if (!activeShipmentId) {
          if (selectedOrderId) {
            const found = data.shipments.find((s: ShipmentHandshake) => s.orderId === selectedOrderId);
            setActiveShipmentId(found ? found.shipmentId : data.shipments[0].shipmentId);
          } else {
            setActiveShipmentId(data.shipments[0].shipmentId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [selectedOrderId]);

  const activeShipment = shipments.find(s => s.shipmentId === activeShipmentId) || shipments[0];

  // Fetch waybill when tab switches
  useEffect(() => {
    if (activeSubTab === 'WAYBILL' && activeShipment) {
      fetch(`/api/logistics/waybill/${activeShipment.orderId}`)
        .then(r => r.json())
        .then(d => {
          if (d.waybill) setWaybillData(d.waybill);
        })
        .catch(console.error);
    }
  }, [activeSubTab, activeShipment?.orderId]);

  // Handle Step 1 Handshake: Seller PIN Verification
  const handleVerifyPickupPin = async () => {
    if (!activeShipment || !sellerPinInput.trim()) return;
    setIsSubmitting(true);
    setHandshakeMessage(null);

    try {
      const res = await fetch('/api/logistics/handshake/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: activeShipment.shipmentId,
          enteredPin: sellerPinInput.trim(),
          conditionNotes: conditionNotesInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify Seller PIN');
      }

      setHandshakeMessage({ text: data.message, isError: false });
      setSellerPinInput('');
      await fetchShipments();
    } catch (err: any) {
      setHandshakeMessage({ text: err.message, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2 Handshake: Buyer Delivery OTP Verification
  const handleVerifyDeliveryOtp = async () => {
    if (!activeShipment || !buyerOtpInput.trim()) return;
    setIsSubmitting(true);
    setHandshakeMessage(null);

    try {
      const res = await fetch('/api/logistics/handshake/verify-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: activeShipment.shipmentId,
          enteredOtp: buyerOtpInput.trim(),
          deliveryFee: 4.50,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify Delivery OTP');
      }

      setHandshakeMessage({ text: data.message, isError: false });
      setBuyerOtpInput('');
      await fetchShipments();
      if (onShipmentDelivered) onShipmentDelivered();
    } catch (err: any) {
      setHandshakeMessage({ text: err.message, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate rider GPS step
  const handleSimulateGpsStep = async () => {
    if (!activeShipment) return;
    try {
      const res = await fetch('/api/logistics/simulate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: activeShipment.shipmentId }),
      });
      const data = await res.json();
      if (data.shipment) {
        setShipments(prev =>
          prev.map(s => (s.shipmentId === data.shipment.shipmentId ? data.shipment : s))
        );
      }
    } catch (err) {
      console.error('Failed to simulate GPS step:', err);
    }
  };

  // Auto-drive simulation loop
  useEffect(() => {
    let interval: number;
    if (isAutoSimulating && activeShipment?.handshakeStep === 'PICKUP_VERIFIED_IN_TRANSIT') {
      interval = window.setInterval(() => {
        handleSimulateGpsStep();
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAutoSimulating, activeShipment?.shipmentId, activeShipment?.handshakeStep]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0b0c10] border border-cyan-500/40 w-full max-w-5xl rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-zinc-950 via-[#0e1017] to-zinc-950 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-black shadow-lg shadow-cyan-500/20 font-black">
              <Truck className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Multi-Tier Logistics & Handshake Hub
                </h2>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Aggregator API
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                On-demand intra-city courier, regional shuttles & 3-way OTP digital escrow handshake
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="bg-zinc-950/80 border-b border-zinc-800/80 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
          {/* Active Shipments Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Active Shipments:
            </span>
            <div className="flex items-center gap-1.5">
              {shipments.map(s => {
                const isSelected = s.shipmentId === activeShipment?.shipmentId;
                const isDelivered = s.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED';
                const isInTransit = s.handshakeStep === 'PICKUP_VERIFIED_IN_TRANSIT';

                return (
                  <button
                    key={s.shipmentId}
                    onClick={() => {
                      setActiveShipmentId(s.shipmentId);
                      setHandshakeMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm shadow-cyan-500/30'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{s.trackingNumber}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDelivered ? 'bg-emerald-400' : isInTransit ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Views */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('TRACKER')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'TRACKER' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Visual Map</span>
            </button>

            <button
              onClick={() => setActiveSubTab('HANDSHAKE')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'HANDSHAKE' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>3-Way OTP Handshake</span>
            </button>

            <button
              onClick={() => setActiveSubTab('WAYBILL')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'WAYBILL' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Digital Waybill</span>
            </button>

            <button
              onClick={() => setActiveSubTab('PUDO')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                activeSubTab === 'PUDO' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>PUDO Hubs (25% Off)</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {activeShipment && (
            <>
              {/* Stepper Status Bar */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">Shipment ID:</span>
                    <span className="font-mono text-xs text-cyan-300 font-bold">{activeShipment.shipmentId}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-400 font-bold">Escrow Order:</span>
                    <span className="font-mono text-xs text-zinc-300">{activeShipment.orderId}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Tier: {activeShipment.logisticsTier.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Method: {activeShipment.deliveryMethod === 'PUDO_HUB' ? 'PUDO Neighborhood Hub' : 'Doorstep Express'}
                    </span>
                  </div>
                </div>

                {/* 5-Step Visual Progress Bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                    activeShipment.handshakeStep !== 'ASSIGNED' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 font-bold'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[11px]">1. Courier Assigned</span>
                    <span className="text-[10px] text-zinc-400">Provider Dispatched</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                    activeShipment.handshakeStep === 'PICKUP_PIN_PENDING'
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 font-bold animate-pulse'
                      : activeShipment.handshakeStep === 'ASSIGNED'
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-[11px]">2. Seller Pickup PIN</span>
                    <span className="text-[10px] text-zinc-400">Step 1 Handshake</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                    activeShipment.handshakeStep === 'PICKUP_VERIFIED_IN_TRANSIT'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-500/20'
                      : activeShipment.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}>
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-[11px]">3. In Transit (GPS)</span>
                    <span className="text-[10px] text-zinc-400">Proof Condition Stamped</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                    activeShipment.handshakeStep === 'PICKUP_VERIFIED_IN_TRANSIT'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-300 font-bold'
                      : activeShipment.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-[11px]">4. Buyer Delivery OTP</span>
                    <span className="text-[10px] text-zinc-400">Step 2 Handshake</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                    activeShipment.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[11px]">5. Split Escrow Payout</span>
                    <span className="text-[10px] text-zinc-400">Merchant + Rider B2C</span>
                  </div>
                </div>
              </div>

              {/* VIEW 1: Live Visual Map Tracker */}
              {activeSubTab === 'TRACKER' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Interactive Map Simulator */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="relative w-full h-[360px] rounded-3xl overflow-hidden bg-[#07090e] border border-cyan-500/30 shadow-inner flex flex-col justify-between p-4">
                      {/* Stylized Neon Map Grid & Road Canvas */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162032" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        {/* Curved Delivery Polyline Route */}
                        <path
                          d="M 60 290 Q 220 220, 360 200 T 640 100"
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="4"
                          strokeDasharray="6 6"
                          className="animate-pulse"
                        />
                      </svg>

                      {/* Top Overlay: Speed & ETA Telemetry */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-cyan-500/30 flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
                            <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                            <span>Live GPS Speed:</span>
                            <span className="text-white font-mono">{activeShipment.driver.speedKmh} km/h</span>
                          </div>
                          <span className="text-zinc-600">|</span>
                          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>ETA: {activeShipment.etaRemainingMinutes} mins</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsAutoSimulating(a => !a)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                              isAutoSimulating
                                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                                : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:text-white'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            <span>{isAutoSimulating ? 'Stop Auto-Drive' : 'Auto-Drive Simulation'}</span>
                          </button>

                          <button
                            onClick={handleSimulateGpsStep}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition flex items-center gap-1 shadow-md shadow-cyan-500/20"
                            title="Advance courier position along the route"
                          >
                            <Navigation className="w-3.5 h-3.5 text-black" />
                            <span>Move 1-Step</span>
                          </button>
                        </div>
                      </div>

                      {/* Simulated Interactive Map Markers */}
                      <div className="relative z-10 w-full h-full flex items-center justify-between px-6">
                        {/* Origin Marker (Merchant Workshop) */}
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-950 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/30">
                            <Store className="w-5 h-5" />
                          </div>
                          <span className="mt-1 text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/30 max-w-[110px] truncate">
                            Seller Origin
                          </span>
                        </div>

                        {/* Moving Rider Vehicle Marker */}
                        <div
                          className="flex flex-col items-center transition-all duration-700 ease-out"
                          style={{
                            transform: `translateX(${(activeShipment.progressPercent - 50) * 2.8}px)`,
                          }}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 border-2 border-white flex items-center justify-center text-black font-black shadow-xl shadow-cyan-500/50">
                              <span className="text-xl">🛵</span>
                            </div>
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black animate-ping" />
                          </div>
                          <div className="mt-1 bg-black/90 px-2 py-0.5 rounded-full border border-cyan-400/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1 whitespace-nowrap shadow-lg">
                            <span>{activeShipment.driver.name}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-white">{activeShipment.driver.vehiclePlate}</span>
                          </div>
                        </div>

                        {/* Destination Marker (Buyer or PUDO Hub) */}
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/30">
                            {activeShipment.deliveryMethod === 'PUDO_HUB' ? <Store className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                          </div>
                          <span className="mt-1 text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30 max-w-[120px] truncate">
                            {activeShipment.deliveryMethod === 'PUDO_HUB' ? 'PUDO Hub' : 'Buyer Doorstep'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Map Status Bar */}
                      <div className="relative z-10 bg-black/80 backdrop-blur-md p-2.5 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Destination:</span>
                          <span className="text-white font-medium truncate max-w-[280px]">
                            {activeShipment.destinationAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Progress:</span>
                          <span className="font-mono text-cyan-400 font-bold">{activeShipment.progressPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Rider Proof-of-Condition Banner */}
                    {activeShipment.proofOfCondition && (
                      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={activeShipment.proofOfCondition.photoUrl}
                            alt="Proof of Condition"
                            className="w-16 h-16 rounded-xl object-cover border border-emerald-500/50 shadow-md"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                Rider Proof of Condition Verified
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded font-bold">
                                {activeShipment.proofOfCondition.conditionStatus}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1 italic">
                              "{activeShipment.proofOfCondition.notes}"
                            </p>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Photo stamped with tamper-seal inspection by {activeShipment.driver.name} at pickup
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveSubTab('HANDSHAKE')}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition whitespace-nowrap"
                        >
                          Verify OTPs
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Courier Driver & Fast Action Card */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Courier Driver Profile */}
                    <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Vetted Delivery Partner
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Background Checked
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <img
                          src={activeShipment.driver.avatarUrl}
                          alt={activeShipment.driver.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg"
                        />
                        <div>
                          <h4 className="text-sm font-black text-white">{activeShipment.driver.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                              ★ {activeShipment.driver.rating}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-xs text-zinc-400">{activeShipment.driver.totalTrips} Trips</span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan-300 font-bold block mt-0.5">
                            {activeShipment.driver.vehiclePlate} ({activeShipment.driver.vehicleModel})
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-zinc-400 block text-[10px]">Driver National ID:</span>
                          <span className="font-mono text-zinc-200 font-semibold">{activeShipment.driver.driverNationalId}</span>
                        </div>
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                          Bonded Operator
                        </span>
                      </div>

                      {/* Direct Call / SMS Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${activeShipment.driver.phone}`}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Call Driver</span>
                        </a>

                        <button
                          onClick={() => alert(`Connecting encrypted SMS proxy to rider ${activeShipment.driver.phone}`)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                          <span>In-App Chat</span>
                        </button>
                      </div>
                    </div>

                    {/* Waybill & Handshake Shortcuts */}
                    <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800 flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between text-zinc-300 font-semibold">
                        <span>Digital Waybill:</span>
                        <span className="font-mono text-purple-400 font-bold">{activeShipment.waybillNumber}</span>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('WAYBILL')}
                        className="w-full py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>View Verified Legal Waybill</span>
                      </button>

                      <button
                        onClick={() => setActiveSubTab('HANDSHAKE')}
                        className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-cyan-500/20"
                      >
                        <Lock className="w-3.5 h-3.5 text-black" />
                        <span>Open 3-Way OTP Terminal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: 3-Way OTP Handshake & Automated Split Payout */}
              {activeSubTab === 'HANDSHAKE' && (
                <div className="flex flex-col gap-6">
                  {handshakeMessage && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                        handshakeMessage.isError
                          ? 'bg-red-950/60 border-red-500/50 text-red-300'
                          : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {handshakeMessage.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>{handshakeMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Handshake Step 1: Seller Terminal */}
                    <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                            1
                          </span>
                          <h3 className="text-sm font-black text-white">Seller Pickup Handshake</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeShipment.handshakeStep !== 'PICKUP_PIN_PENDING'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          }`}
                        >
                          {activeShipment.handshakeStep !== 'PICKUP_PIN_PENDING' ? 'VERIFIED' : 'PIN PENDING'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400">
                        When the driver arrives at your shop/studio, hand over the package only after verifying the 4-digit Pickup PIN or scanning the driver badge.
                      </p>

                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Seller Pickup PIN
                          </span>
                          <span className="text-2xl font-black font-mono text-amber-400 tracking-widest">
                            {activeShipment.sellerPickupPin}
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-amber-400 shadow-inner">
                          <QrCode className="w-7 h-7" />
                        </div>
                      </div>

                      {/* Interactive PIN verification simulator for testing */}
                      {activeShipment.handshakeStep === 'PICKUP_PIN_PENDING' ? (
                        <div className="flex flex-col gap-3 pt-2">
                          <label className="text-xs font-bold text-zinc-300">
                            Driver Terminal: Enter Seller PIN to collect package
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="e.g. 4821"
                              value={sellerPinInput}
                              onChange={e => setSellerPinInput(e.target.value)}
                              className="bg-black border border-zinc-700 text-white font-mono text-center tracking-widest text-lg font-black rounded-xl px-3 py-2 w-28 focus:border-amber-400 focus:outline-none"
                            />
                            <button
                              onClick={() => setSellerPinInput(activeShipment.sellerPickupPin)}
                              className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                            >
                              Auto-Fill
                            </button>
                            <button
                              onClick={handleVerifyPickupPin}
                              disabled={isSubmitting || sellerPinInput.length !== 4}
                              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs transition shadow-md shadow-amber-500/20"
                            >
                              {isSubmitting ? 'Verifying...' : 'Confirm Pickup Handshake'}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <Camera className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Photo condition proof automatically logged with GPS timestamp</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Pickup verified! Package collected and marked officially in transit.</span>
                        </div>
                      )}
                    </div>

                    {/* Handshake Step 2: Buyer Terminal */}
                    <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                            2
                          </span>
                          <h3 className="text-sm font-black text-white">Buyer Delivery OTP</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeShipment.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {activeShipment.handshakeStep === 'DELIVERED_PAYOUT_DISPATCHED' ? 'DELIVERED' : 'OTP REQUIRED'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400">
                        Do not give this OTP to the driver until you hold the parcel and inspect the condition.
                        Entering this OTP immediately releases funds to the seller and disburses rider delivery fee.
                      </p>

                      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Buyer 6-Digit Delivery OTP
                          </span>
                          <span className="text-2xl font-black font-mono text-cyan-400 tracking-widest">
                            {activeShipment.buyerDeliveryOtp}
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-inner">
                          <Lock className="w-7 h-7" />
                        </div>
                      </div>

                      {/* Interactive OTP Verification Pad */}
                      {activeShipment.handshakeStep !== 'DELIVERED_PAYOUT_DISPATCHED' ? (
                        <div className="flex flex-col gap-3 pt-2">
                          <label className="text-xs font-bold text-zinc-300">
                            Driver Keypad: Enter Buyer OTP upon parcel handover
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 749210"
                              value={buyerOtpInput}
                              onChange={e => setBuyerOtpInput(e.target.value)}
                              className="bg-black border border-zinc-700 text-white font-mono text-center tracking-widest text-lg font-black rounded-xl px-3 py-2 w-36 focus:border-cyan-400 focus:outline-none"
                            />
                            <button
                              onClick={() => setBuyerOtpInput(activeShipment.buyerDeliveryOtp)}
                              className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                            >
                              Auto-Fill
                            </button>
                            <button
                              onClick={handleVerifyDeliveryOtp}
                              disabled={isSubmitting || buyerOtpInput.length !== 6}
                              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-xs transition shadow-md shadow-cyan-500/20"
                            >
                              {isSubmitting ? 'Verifying...' : 'Confirm Delivery & Release Escrow'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Delivery perfected! Handshake completed with cryptographic verification.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Automated Split Payout Receipt */}
                  {activeShipment.automatedPayout && (
                    <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-950 to-zinc-950 p-6 rounded-3xl border border-emerald-500/40 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                          <span>Automated BizTok Escrow Split Payout Executed</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Instant Mobile Money Disbursed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-black/60 p-3.5 rounded-2xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                            Merchant Escrow Payout
                          </span>
                          <span className="text-xl font-black text-emerald-400">
                            ${activeShipment.automatedPayout.merchantPayoutAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Released to {activeShipment.automatedPayout.merchantName}
                          </span>
                        </div>

                        <div className="bg-black/60 p-3.5 rounded-2xl border border-cyan-500/30">
                          <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                            Rider Delivery Fee (M-Pesa B2C)
                          </span>
                          <span className="text-xl font-black text-cyan-300">
                            ${activeShipment.automatedPayout.riderDeliveryFee.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            M-Pesa: {activeShipment.automatedPayout.riderMpesaReceipt}
                          </span>
                        </div>

                        <div className="bg-black/60 p-3.5 rounded-2xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                            Platform Commission
                          </span>
                          <span className="text-xl font-black text-zinc-300">
                            ${activeShipment.automatedPayout.platformFee.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            BizTok Trust & Safety Guarantee
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: Legal Digital Waybill with Verified Permits */}
              {activeSubTab === 'WAYBILL' && (
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        Official Digital Waybill & Bill of Lading
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Binding legal transport manifest generated from verified business registration credentials
                      </p>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Print Legal Label</span>
                    </button>
                  </div>

                  {waybillData ? (
                    <div className="bg-black/90 p-6 rounded-2xl border-2 border-purple-500/40 font-mono text-xs text-zinc-300 flex flex-col gap-4 shadow-2xl">
                      {/* Waybill Top Banner */}
                      <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                        <div>
                          <div className="text-base font-black text-white tracking-widest">
                            BIZTOK EXPRESS WAYBILL
                          </div>
                          <div className="text-xs text-purple-400 font-bold">
                            {waybillData.waybillNumber}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Order Ref: {waybillData.orderId} • Date: {new Date(waybillData.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded font-bold">
                            VERIFIED PERMIT ATTACHED
                          </span>
                        </div>
                      </div>

                      {/* Seller & Carrier Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-zinc-800">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-500">Shipper (Verified Merchant)</span>
                          <span className="text-sm font-bold text-white">{waybillData.sellerBusinessName}</span>
                          <span className="text-xs text-cyan-300">Tax ID / EIN: {waybillData.sellerTaxId}</span>
                          <span className="text-xs text-zinc-400">Permit: {waybillData.sellerPermitNumber}</span>
                          <span className="text-xs text-zinc-400">Origin: {waybillData.originAddress}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-500">Authorized Courier & Driver</span>
                          <span className="text-sm font-bold text-white">{waybillData.driverName}</span>
                          <span className="text-xs text-amber-300">National ID: {waybillData.driverNationalId}</span>
                          <span className="text-xs text-zinc-400">Vehicle Plate: {waybillData.driverPlate}</span>
                          <span className="text-xs text-zinc-400">Destination: {waybillData.destinationAddress}</span>
                        </div>
                      </div>

                      {/* Cargo Description & Scannable QR Payload */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-8 flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Declared Goods:</span>
                            <span className="text-xs font-bold text-white">{waybillData.declaredItemTitle}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>Declared Value: <strong className="text-emerald-400">${waybillData.declaredValueUsd} USD</strong></span>
                            <span>Weight: <strong className="text-zinc-200">{waybillData.packageWeightKg} kg</strong></span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                            {waybillData.legalNotice}
                          </p>
                        </div>

                        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                          <QrCode className="w-16 h-16 text-purple-400" />
                          <span className="text-[9px] text-zinc-400 mt-1 font-mono">
                            BIZTOK-SEC-CRYPTOGRAPHIC-QR
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      Loading digital waybill data...
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 4: PUDO Neighborhood Hubs (Local Pick-up Points) */}
              {activeSubTab === 'PUDO' && (
                <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-400" />
                        P2P Neighborhood Hubs & Parcel Lockers (PUDO)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Partnered corner shops, petrol stations, and supermarkets with 20% - 30% discounted delivery rates
                      </p>
                    </div>

                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                      Zero Home Wait Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PUDO_HUBS.map(hub => {
                      const isCurrent = activeShipment.pudoHub?.id === hub.id;

                      return (
                        <div
                          key={hub.id}
                          className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                            isCurrent
                              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                              : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{hub.partnerLogo}</span>
                                <div>
                                  <h4 className="text-xs font-bold text-white">{hub.name}</h4>
                                  <span className="text-[10px] text-emerald-400 font-semibold block">
                                    {(hub.discountRate * 100).toFixed(0)}% Off Shipping Fare
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono text-zinc-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                                {hub.distanceKm} km
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 mt-2.5">
                              {hub.address}, {hub.neighborhood}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {hub.operatingHours}
                            </span>

                            <span className="font-semibold text-zinc-300">
                              OTP Pickup Lockers
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
