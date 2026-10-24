/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Award,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileCheck2,
  Zap,
  Globe,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { MerchantAccount } from '../lib/businessVerification';

interface MerchantGateProps {
  merchant: MerchantAccount;
  onVerifySuccess: (updated: MerchantAccount) => void;
  onToggleTier: () => void;
  onToggleVerifyState: () => void;
}

export function MerchantGate({
  merchant,
  onVerifySuccess,
  onToggleTier,
  onToggleVerifyState,
}: MerchantGateProps) {
  const [businessName, setBusinessName] = useState('Nordic Ceramics Studio Inc');
  const [country, setCountry] = useState<'US' | 'EU' | 'UK' | 'SG' | 'GLOBAL'>('US');
  const [idType, setIdType] = useState<'EIN' | 'VAT' | 'CRN' | 'UEN' | 'DUNS'>('EIN');
  const [idNumber, setIdNumber] = useState('12-3456789');
  const [beneficialOwner, setBeneficialOwner] = useState('Astrid Lind');
  const [address, setAddress] = useState('452 Baltic Harbor Way, Portland, OR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  const handleCountryChange = (c: 'US' | 'EU' | 'UK' | 'SG' | 'GLOBAL') => {
    setCountry(c);
    setValidationError(null);
    if (c === 'US') {
      setIdType('EIN');
      setIdNumber('12-3456789');
    } else if (c === 'EU') {
      setIdType('VAT');
      setIdNumber('DE123456789');
    } else if (c === 'UK') {
      setIdType('CRN');
      setIdNumber('01234567');
    } else if (c === 'SG') {
      setIdType('UEN');
      setIdNumber('201812345A');
    } else {
      setIdType('DUNS');
      setIdNumber('01-234-5678');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const res = await fetch('/api/merchants/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          country,
          idType,
          idNumber,
          registeredAddress: address,
          beneficialOwnerName: beneficialOwner,
          industryCategory: 'Lifestyle & Design',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Business verification rejected');
      }

      setSuccessInfo(data.verification);
      onVerifySuccess(data.merchant);
    } catch (err: any) {
      setValidationError(err.message || 'Registration verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              merchant.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Verified Business Registration Gateway
              {merchant.isVerified ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> GATED
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Strict onboarding middleware: commercial features are locked until legal business identification is validated.
            </p>
          </div>
        </div>

        {/* Quick Testing Toggle */}
        <button
          onClick={onToggleVerifyState}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition shrink-0"
          title="Toggle verification state for quick testing"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Toggle Verification ({merchant.isVerified ? 'Mock Revoke' : 'Mock Approve'})</span>
        </button>
      </div>

      {/* Verified State View */}
      {merchant.isVerified ? (
        <div className="flex flex-col gap-5">
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300">
                  Business Entity Authenticated & Active
                </h4>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Legal Name: <strong>{merchant.businessName}</strong> • Official Tax ID: {merchant.idNumber || '12-3456789 (US EIN)'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
                  <span>Jurisdiction: {merchant.country || 'United States'}</span>
                  <span>•</span>
                  <span>KYC Checksum: Passed (IRS/VIES/ACRA)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-700">
                Merchant Features Unlocked
              </span>
            </div>
          </div>

          {/* Seller Account Tier Switcher */}
          <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Merchant Account Tier</h4>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      merchant.tier === 'PREMIUM'
                        ? 'bg-amber-400 text-black'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {merchant.tier}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {merchant.tier === 'PREMIUM'
                    ? '⚡ +35% Algorithmic Feed recommendation multiplier is currently ACTIVE for all your products.'
                    : 'Standard distribution rate. Upgrade to Premium Tier to unlock a +35% algorithmic ranking multiplier.'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleTier}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shrink-0 ${
                merchant.tier === 'PREMIUM'
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{merchant.tier === 'PREMIUM' ? 'Downgrade to Standard' : 'Upgrade to Premium Tier (+35% Boost)'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Gated Registration Form */
        <div className="flex flex-col gap-5">
          {/* Strict Gating Banner */}
          <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex items-start gap-3 text-red-200">
            <Lock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-red-300 font-bold">Strict Middleware Lock (HTTP 403 Forbidden):</strong>
              <br />
              Commercial product publishing, feed boost algorithms, and the Gemini AI Ad Studio are strictly locked until your legal entity verification passes. Complete the form below to unlock.
            </div>
          </div>

          {validationError && (
            <div className="bg-red-900/40 border border-red-600 rounded-xl p-3 flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legal Entity Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Nordic Ceramics Studio Inc"
                required
              />
            </div>

            {/* Jurisdiction */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Incorporation Jurisdiction
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['US', 'EU', 'UK', 'SG'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCountryChange(c)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      country === c
                        ? 'bg-cyan-500 text-black border-cyan-400'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Business ID Type and Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Official Business Identification Number ({idType})
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                placeholder={
                  idType === 'EIN'
                    ? '12-3456789 (US EIN)'
                    : idType === 'VAT'
                    ? 'DE123456789 (EU VAT)'
                    : idType === 'CRN'
                    ? '01234567 (UK CRN)'
                    : '201812345A (SG UEN)'
                }
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Format validated against official registrar standards (IRS, VIES, Companies House, ACRA).
              </span>
            </div>

            {/* Primary Beneficial Owner / KYC Director */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Authorized Beneficial Owner / KYC Officer
              </label>
              <input
                type="text"
                value={beneficialOwner}
                onChange={e => setBeneficialOwner(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="Full Legal Name"
                required
              />
            </div>

            {/* Commercial Office Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Registered Commercial Business Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                placeholder="Street Address, City, State/Province, Postal Code"
                required
              />
            </div>

            {/* Submit Action */}
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Verifying Legal Entity Checksum...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Legal Business Verification</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
