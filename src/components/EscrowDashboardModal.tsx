/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Package,
  RefreshCw,
  Plus
} from 'lucide-react';
import { EscrowOrder } from '../lib/escrowEngine';

interface EscrowDashboardModalProps {
  onClose: () => void;
  onOrderUpdated?: () => void;
  onOpenLogistics?: (orderId: string) => void;
}

export function EscrowDashboardModal({ onClose, onOrderUpdated, onOpenLogistics }: EscrowDashboardModalProps) {
  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrier, setCarrier] = useState<'FedEx' | 'DHL' | 'UPS' | 'SendyExpress'>('FedEx');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/escrow/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAttachTracking = async (orderId: string) => {
    if (!trackingInput.trim()) return;
    try {
      const res = await fetch('/api/escrow/attach-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          trackingNumber: trackingInput,
          carrier,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to attach tracking');
      }

      setActionMessage(data.message);
      setSelectedOrderId(null);
      setTrackingInput('');
      fetchOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReleaseFunds = async (orderId: string) => {
    try {
      const res = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to release escrow');
      }

      setActionMessage(data.message);
      fetchOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalLocked = orders
    .filter(o => o.escrowStatus === 'FUNDS_LOCKED_IN_ESCROW' || o.escrowStatus === 'SHIPPED_TRACKING_GENERATED')
    .reduce((sum, o) => sum + (o.escrowHoldAmount || 0), 0);

  const totalReleased = orders
    .filter(o => o.escrowStatus === 'DELIVERED_ESCROW_RELEASED')
    .reduce((sum, o) => sum + o.merchantPayoutAmount, 0);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                BizTok Escrow Vault & Shipping Manager
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Real-Time Escrow Protocol
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Buyer funds remain securely locked until the merchant inputs an official courier tracking ID.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-5 py-2.5 flex items-center justify-between text-xs text-emerald-200">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-400 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-zinc-950/60 border-b border-zinc-800 text-xs">
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Funds Locked in Escrow
            </span>
            <span className="text-lg font-black text-amber-400 mt-1 block">
              ${totalLocked.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-500">Awaiting tracking or delivery</span>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-cyan-400" /> Shipped / Tracking Attached
            </span>
            <span className="text-lg font-black text-cyan-400 mt-1 block">
              {orders.filter(o => o.escrowStatus === 'SHIPPED_TRACKING_GENERATED').length} orders
            </span>
            <span className="text-[10px] text-zinc-500">In courier transit</span>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            <span className="text-zinc-400 text-[11px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Released Merchant Payouts
            </span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">
              ${totalReleased.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-500">Completed & verified</span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Active Orders Under Escrow Custody ({orders.length})
          </span>

          {orders.map(order => (
            <div
              key={order.orderId}
              className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-300">{order.orderId}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {order.paymentMethod === 'MPESA_STK' ? '📱 M-Pesa Mobile' : '💳 Credit Card'}
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {order.escrowStatus === 'FUNDS_LOCKED_IN_ESCROW' && (
                    <span className="bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" /> Funds Locked (Generate Tracking)
                    </span>
                  )}
                  {order.escrowStatus === 'SHIPPED_TRACKING_GENERATED' && (
                    <span className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-cyan-400" /> Tracking Verified ({order.carrier})
                    </span>
                  )}
                  {order.escrowStatus === 'DELIVERED_ESCROW_RELEASED' && (
                    <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Delivered • Escrow Payout Released
                    </span>
                  )}
                </div>
              </div>

              {/* Order Item & Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                <div className="md:col-span-5">
                  <h4 className="font-bold text-white text-sm">{order.productTitle}</h4>
                  <p className="text-zinc-400 mt-0.5">
                    Buyer: <strong className="text-zinc-200">{order.buyerName}</strong> ({order.shippingAddress})
                  </p>
                </div>

                <div className="md:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Total Charged:</span>
                    <strong className="text-white font-mono">${order.amount.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>Fee (5%): ${order.platformFee.toFixed(2)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Payout: ${order.merchantPayoutAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions per Status */}
                <div className="md:col-span-4 flex flex-col items-end gap-2">
                  {order.escrowStatus === 'FUNDS_LOCKED_IN_ESCROW' && (
                    <div className="w-full">
                      {selectedOrderId === order.orderId ? (
                        <div className="flex flex-col gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-700">
                          <div className="flex gap-1.5">
                            <select
                              value={carrier}
                              onChange={(e: any) => setCarrier(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2 py-1 text-white"
                            >
                              <option value="FedEx">FedEx</option>
                              <option value="DHL">DHL</option>
                              <option value="UPS">UPS</option>
                              <option value="SendyExpress">SendyExpress</option>
                            </select>
                            <input
                              type="text"
                              value={trackingInput}
                              onChange={e => setTrackingInput(e.target.value)}
                              placeholder="e.g. FDX-982144-EXP"
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setSelectedOrderId(null)}
                              className="text-[11px] text-zinc-400 hover:text-white px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAttachTracking(order.orderId)}
                              className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1 rounded-lg"
                            >
                              Verify & Attach
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.orderId);
                            setTrackingInput(`FDX-${Math.floor(Math.random() * 899999 + 100000)}-US`);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Generate Tracking to Unlock Escrow</span>
                        </button>
                      )}
                    </div>
                  )}

                  {order.escrowStatus === 'SHIPPED_TRACKING_GENERATED' && (
                    <div className="flex flex-col items-end gap-1.5 w-full">
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        📦 {order.carrier}: {order.trackingNumber}
                      </span>
                      <button
                        onClick={() => handleReleaseFunds(order.orderId)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Delivery & Release Escrow</span>
                      </button>
                    </div>
                  )}

                  {order.escrowStatus === 'DELIVERED_ESCROW_RELEASED' && (
                    <div className="text-right">
                      <span className="text-emerald-400 text-xs font-bold block">
                        ✓ Payout Released: ${order.merchantPayoutAmount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Ref: {order.trackingNumber}</span>
                    </div>
                  )}

                  {onOpenLogistics && (
                    <button
                      onClick={() => onOpenLogistics(order.orderId)}
                      className="mt-2 py-1.5 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live Logistics Map & 3-Way OTP</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
