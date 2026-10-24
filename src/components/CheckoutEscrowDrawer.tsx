/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  PhoneCall
} from 'lucide-react';
import { FeedProduct } from '../lib/recommendationEngine';
import { PaymentMethodType, validateMPesaPhone } from '../lib/escrowEngine';

interface CheckoutEscrowDrawerProps {
  product: FeedProduct;
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

export function CheckoutEscrowDrawer({
  product,
  onClose,
  onOrderSuccess,
}: CheckoutEscrowDrawerProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [buyerName, setBuyerName] = useState('Alex Mwangi');
  const [shippingAddress, setShippingAddress] = useState('100 Silicon Way, Tech District, Nairobi');

  // Card details
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('884');

  // M-Pesa details
  const [mpesaPhone, setMpesaPhone] = useState('254712345678');
  const [stkStatus, setStkStatus] = useState<'IDLE' | 'PROMPTED' | 'CONFIRMED' | 'FAILED'>('IDLE');
  const [stkCountdown, setStkCountdown] = useState(15);
  const [stkMessage, setStkMessage] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // M-Pesa STK countdown simulation
  useEffect(() => {
    let timer: number;
    if (stkStatus === 'PROMPTED' && stkCountdown > 0) {
      timer = window.setInterval(() => {
        setStkCountdown(c => c - 1);
      }, 1000);
    } else if (stkStatus === 'PROMPTED' && stkCountdown === 0) {
      // Simulate user entering M-Pesa PIN on handset
      setStkStatus('CONFIRMED');
      finalizeOrder('MPESA_STK', `MPESA_REC_${Date.now()}`);
    }
    return () => clearInterval(timer);
  }, [stkStatus, stkCountdown]);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    if (paymentMethod === 'MPESA_STK') {
      const phoneCheck = validateMPesaPhone(mpesaPhone);
      if (!phoneCheck.valid) {
        setErrorMessage(phoneCheck.reason || 'Invalid M-Pesa phone number');
        setIsProcessing(false);
        return;
      }

      try {
        const res = await fetch('/api/checkout/mpesa-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneCheck.formatted,
            amount: product.price,
            orderId: `ord_mpesa_${Date.now()}`,
            accountReference: `BizTok_${product.title.slice(0, 10)}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initiate M-Pesa STK push');
        }

        setStkMessage(data.customerMessage);
        setStkStatus('PROMPTED');
        setStkCountdown(12);
      } catch (err: any) {
        setErrorMessage(err.message || 'M-Pesa Gateway timeout');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Standard Card Payment
      setTimeout(() => {
        finalizeOrder('CARD', `CARD_AUTH_${Date.now()}`);
      }, 1200);
    }
  };

  const finalizeOrder = async (method: PaymentMethodType, ref: string) => {
    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          amount: product.price,
          buyerName,
          buyerPhone: mpesaPhone,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          paymentMethod: method,
          paymentReference: ref,
          shippingAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create escrow order');
      }

      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message);
      setIsProcessing(false);
      setStkStatus('IDLE');
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end">
      <div className="bg-zinc-900 border-t border-zinc-700 rounded-t-[32px] p-5 shadow-2xl flex flex-col gap-4 max-h-[90%] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">BizTok Escrow Checkout</h3>
              <p className="text-[10px] text-zinc-400">Funds locked until shipping tracking verified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product summary card */}
        <div className="flex gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
          <img src={product.thumbnailUrl} alt={product.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
            <span className="text-[11px] text-zinc-400">Sold by {product.sellerName}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm font-black text-emerald-400">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-[10px] text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-1.5 py-0.2 rounded">
                100% Escrow Protected
              </span>
            </div>
          </div>
        </div>

        {/* Escrow Vault Explanation Banner */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-200 leading-relaxed">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300 font-semibold">BizTok Escrow Protection:</strong> Your payment of <strong>${product.price.toFixed(2)}</strong> will be held in the secure vault. Funds cannot be withdrawn by the merchant until they generate and verify an official courier tracking ID (FedEx/DHL/Sendy).
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-900/40 border border-red-600 rounded-xl p-3 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STK Push Handset Simulation Screen */}
        {stkStatus === 'PROMPTED' ? (
          <div className="bg-zinc-950 border border-emerald-500/50 rounded-2xl p-5 text-center flex flex-col items-center gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">M-Pesa STK Push Sent!</h4>
              <p className="text-xs text-emerald-300 mt-1">{stkMessage}</p>
              <p className="text-[11px] text-zinc-400 mt-2">
                Simulating user handset prompt... Auto-authorizing in <strong className="text-white font-mono">{stkCountdown}s</strong>
              </p>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(stkCountdown / 12) * 100}%` }}
              />
            </div>
            <button
              onClick={() => {
                setStkStatus('CONFIRMED');
                finalizeOrder('MPESA_STK', `MPESA_REC_${Date.now()}`);
              }}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
            >
              Skip countdown & simulate PIN entry now
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleInitiatePayment} className="flex flex-col gap-3">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Select Payment Gateway
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold block text-white">Global Card</span>
                    <span className="text-[10px] text-zinc-500">Visa, Mastercard</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MPESA_STK')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    paymentMethod === 'MPESA_STK'
                      ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold block text-white">M-Pesa Mobile</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">STK Push Direct</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Conditional Fields based on Payment Method */}
            {paymentMethod === 'MPESA_STK' ? (
              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-2">
                <label className="block text-xs font-semibold text-emerald-300">
                  Mobile Money Phone Number (Daraja Gateway)
                </label>
                <div className="flex gap-2">
                  <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-400 font-mono flex items-center">
                    🇰🇪 +254
                  </span>
                  <input
                    type="text"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="712345678"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-400">
                  A real-time SIM toolkit prompt will pop up on this phone requiring PIN authentication.
                </span>
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
                <label className="block text-xs font-semibold text-zinc-300">Card Credentials</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="Card Number"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="MM/YY"
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="CVC"
                  />
                </div>
              </div>
            )}

            {/* Buyer & Shipping Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Buyer Full Name</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            {/* Submit / Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] ${
                paymentMethod === 'MPESA_STK'
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-black'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black'
              }`}
            >
              {isProcessing ? (
                <span>Routing Payment to Escrow Vault...</span>
              ) : paymentMethod === 'MPESA_STK' ? (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Send M-Pesa STK Push • ${product.price.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Lock ${product.price.toFixed(2)} in Escrow & Order</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
