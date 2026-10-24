/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Gift,
  X,
  Sparkles,
  Truck,
  Check,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  Send
} from 'lucide-react';
import { TOKGIFT_CATALOG, TokGiftItem, PhysicalGiftDispatchRecord } from '../lib/tokGifts';

interface TokGiftDrawerProps {
  creatorName: string;
  creatorId: string;
  onClose: () => void;
  onGiftSent: (gift: TokGiftItem, record: PhysicalGiftDispatchRecord) => void;
}

export function TokGiftDrawer({
  creatorName,
  creatorId,
  onClose,
  onGiftSent,
}: TokGiftDrawerProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'fulfillment'>('send');
  const [selectedGiftId, setSelectedGiftId] = useState<string>(TOKGIFT_CATALOG[0].id);
  const [senderName, setSenderName] = useState('Alex_Fan');
  const [shippingAddress, setShippingAddress] = useState('Fulfillment Center Bay 4, Austin TX');
  const [isSending, setIsSending] = useState(false);
  const [dispatchQueue, setDispatchQueue] = useState<PhysicalGiftDispatchRecord[]>([]);

  // Fetch current seller dispatch queue
  const fetchDispatchQueue = async () => {
    try {
      const res = await fetch('/api/gifts/dispatch-queue');
      const data = await res.json();
      if (data.queue) {
        setDispatchQueue(data.queue);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDispatchQueue();
  }, []);

  const handleSendGift = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: selectedGiftId,
          recipientCreatorId: creatorId,
          recipientCreatorName: creatorName,
          senderUserId: `user_${Date.now()}`,
          senderUserName: senderName,
          shippingAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send gift');
      }

      onGiftSent(data.gift, data.dispatchRecord);
      fetchDispatchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleShipGift = async (dispatchId: string) => {
    try {
      const trackingNumber = `TRK-TG-${Math.floor(Math.random() * 89999 + 10000)}-EXP`;
      const res = await fetch('/api/gifts/dispatch-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchId, trackingNumber }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDispatchQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentSelectedGift = TOKGIFT_CATALOG.find(g => g.id === selectedGiftId) || TOKGIFT_CATALOG[0];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end select-none">
      <div className="bg-zinc-900 border-t border-zinc-700 rounded-t-[32px] p-5 shadow-2xl flex flex-col gap-4 max-h-[90%] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 text-black flex items-center justify-center font-bold">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                TokGifts: Physical-Redemption Gifting
                <span className="bg-pink-500/10 text-pink-400 border border-pink-500/30 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  Physical Dispatch
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Sending a gift automatically triggers physical order dispatch in seller's fulfillment queue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch between Send Gift and Seller Dispatch Queue */}
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Send Physical Gift to @{creatorName.replace(/\s+/g, '').toLowerCase()}</span>
          </button>

          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'fulfillment'
                ? 'bg-cyan-500 text-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Seller Fulfillment Queue ({dispatchQueue.length})</span>
          </button>
        </div>

        {activeTab === 'send' ? (
          /* Send Gift View */
          <div className="flex flex-col gap-4">
            {/* TokGift Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {TOKGIFT_CATALOG.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGiftId(gift.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                    selectedGiftId === gift.id
                      ? 'bg-zinc-950 border-amber-400 ring-1 ring-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{gift.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {gift.badge}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-white truncate">{gift.name}</h4>
                    <span className="text-sm font-black text-amber-400 block mt-0.5">
                      ${gift.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Gift Physical Spec Breakdown */}
            <div className="bg-zinc-950 rounded-2xl p-3.5 border border-zinc-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  Physical Item Delivered to Creator / Beneficiary:
                </span>
                <span className="text-amber-400 font-bold font-mono">
                  ${currentSelectedGift.price.toFixed(2)}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {currentSelectedGift.physicalItemDescription}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/80">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-cyan-400" /> {currentSelectedGift.deliveryTimeframe}
                </span>
                <span>•</span>
                <span>Weight: ~{currentSelectedGift.estimatedWeightGrams}g</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Automatic Dispatch Order</span>
              </div>
            </div>

            {/* Sender and Shipping Form */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Your Display Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Redemption Hub / Address</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendGift}
              disabled={isSending}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:opacity-95 text-black font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-pink-500/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSending ? (
                <span>Queueing Physical Fulfillment Dispatch...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-black" />
                  <span>
                    Send {currentSelectedGift.icon} {currentSelectedGift.name} (${currentSelectedGift.price.toFixed(2)})
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Seller Fulfillment Queue View */
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Physical Gift Dispatch Queue ({dispatchQueue.length})
            </span>

            {dispatchQueue.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No physical gift orders pending packaging.
              </div>
            ) : (
              dispatchQueue.map(item => (
                <div
                  key={item.dispatchId}
                  className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.giftName}</span>
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                        ${item.giftPrice.toFixed(2)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.fulfillmentStatus === 'DISPATCHED_IN_TRANSIT'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {item.fulfillmentStatus === 'DISPATCHED_IN_TRANSIT'
                        ? 'In Transit 🚚'
                        : 'Pending Packaging 📦'}
                    </span>
                  </div>

                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    <strong>Physical Item:</strong> {item.physicalItemDescription}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <div>
                      From <strong>{item.senderUserName}</strong> • To{' '}
                      <strong>{item.recipientCreatorName}</strong> ({item.shippingAddress})
                    </div>

                    {item.fulfillmentStatus === 'PENDING_SELLER_PACKAGING' ? (
                      <button
                        onClick={() => handleShipGift(item.dispatchId)}
                        className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold px-2.5 py-1 rounded-lg text-[10px]"
                      >
                        Package & Attach Courier Tracking
                      </button>
                    ) : (
                      <span className="font-mono text-cyan-400">
                        {item.assignedTrackingNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
