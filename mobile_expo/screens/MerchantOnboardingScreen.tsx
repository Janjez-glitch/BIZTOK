import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ShieldCheck, Lock, Award, AlertCircle, CheckCircle2, ChevronRight, Zap } from 'lucide-react-native';

interface MerchantOnboardingProps {
  isVerified: boolean;
  tier: 'STANDARD' | 'PREMIUM';
  onVerificationSuccess: () => void;
  onToggleTier: () => void;
}

export function MerchantOnboardingScreen({
  isVerified,
  tier,
  onVerificationSuccess,
  onToggleTier
}: MerchantOnboardingProps) {
  const [businessName, setBusinessName] = useState('Nordic Crafts Studio Inc');
  const [country, setCountry] = useState<'US' | 'EU' | 'UK' | 'SG'>('US');
  const [idType, setIdType] = useState<'EIN' | 'VAT' | 'CRN' | 'UEN'>('EIN');
  const [idNumber, setIdNumber] = useState('12-3456789');
  const [beneficialOwner, setBeneficialOwner] = useState('Astrid Lind');
  const [address, setAddress] = useState('452 Baltic Harbor Way, Portland, OR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/merchants/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          country,
          id_type: idType,
          id_number: idNumber,
          registered_address: address,
          beneficial_owner_name: beneficialOwner,
          industry_category: 'Lifestyle & Design',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail?.message || data.errorMessage || 'Validation failed');
      }

      onVerificationSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification rejected by strict onboarding policy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <ShieldCheck size={28} color={isVerified ? '#10b981' : '#f59e0b'} />
          <Text style={styles.headerTitle}>
            {isVerified ? 'Verified Business Portal' : 'Business Registration Gate'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isVerified
            ? 'Your legal entity is verified with official tax registries. Merchant features and AI Ad Studio are fully unlocked.'
            : 'BizTok requires strict identity validation (EIN/VAT/CRN/UEN) before unlocking merchant publishing or commercial algorithms.'}
        </Text>
      </View>

      {/* Verified Status Banner */}
      {isVerified ? (
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedStatusHeader}>
            <CheckCircle2 size={24} color="#10b981" />
            <Text style={styles.verifiedStatusTitle}>Legal Entity Authenticated</Text>
          </View>
          <Text style={styles.verifiedStatusBody}>
            Business ID: {idNumber} ({idType} - {country})
          </Text>

          {/* Premium Account Tier Switcher */}
          <View style={styles.tierContainer}>
            <View style={styles.tierInfo}>
              <View style={styles.tierTitleRow}>
                <Award size={20} color={tier === 'PREMIUM' ? '#f59e0b' : '#9ca3af'} />
                <Text style={styles.tierTitle}>
                  Seller Account Tier: <Text style={{ color: tier === 'PREMIUM' ? '#f59e0b' : '#ffffff' }}>{tier}</Text>
                </Text>
              </View>
              <Text style={styles.tierSubtitle}>
                {tier === 'PREMIUM'
                  ? '⚡ +35% Algorithmic Feed recommendation priority is ACTIVE'
                  : 'Standard distribution speed. Upgrade to unlock +35% algorithmic boost.'}
              </Text>
            </View>

            <TouchableOpacity style={styles.tierButton} onPress={onToggleTier}>
              <Zap size={16} color="#000000" />
              <Text style={styles.tierButtonText}>
                {tier === 'PREMIUM' ? 'Switch to Standard' : 'Upgrade to Premium'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Onboarding Form */
        <View style={styles.formCard}>
          <View style={styles.gateNotice}>
            <Lock size={18} color="#ef4444" />
            <Text style={styles.gateNoticeText}>
              Merchant publishing is locked until registration verification completes.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <AlertCircle size={18} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Business Name */}
          <Text style={styles.fieldLabel}>Legal Entity Name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Official registered corporation name"
            placeholderTextColor="#6b7280"
          />

          {/* Country Selection */}
          <Text style={styles.fieldLabel}>Jurisdiction</Text>
          <View style={styles.selectorRow}>
            {(['US', 'EU', 'UK', 'SG'] as const).map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.selectorPill, country === c && styles.selectorPillActive]}
                onPress={() => {
                  setCountry(c);
                  if (c === 'US') setIdType('EIN');
                  if (c === 'EU') setIdType('VAT');
                  if (c === 'UK') setIdType('CRN');
                  if (c === 'SG') setIdType('UEN');
                }}
              >
                <Text style={[styles.selectorPillText, country === c && styles.selectorPillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Business ID Type */}
          <Text style={styles.fieldLabel}>Identification Number Type ({idType})</Text>
          <TextInput
            style={styles.input}
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="e.g. 12-3456789 (US EIN)"
            placeholderTextColor="#6b7280"
          />

          {/* Beneficial Owner KYC */}
          <Text style={styles.fieldLabel}>Primary Beneficial Owner / Managing Director</Text>
          <TextInput
            style={styles.input}
            value={beneficialOwner}
            onChangeText={setBeneficialOwner}
            placeholder="Authorized legal representative"
            placeholderTextColor="#6b7280"
          />

          {/* Registered Address */}
          <Text style={styles.fieldLabel}>Registered Commercial Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Official registered office location"
            placeholderTextColor="#6b7280"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleVerify}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <ShieldCheck size={20} color="#000000" />
                <Text style={styles.submitButtonText}>Submit Legal Business Verification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  verifiedCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verifiedStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verifiedStatusTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedStatusBody: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 16,
  },
  tierContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tierInfo: {
    marginBottom: 12,
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  tierSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tierButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  tierButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  gateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#450a0a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  gateNoticeText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#fee2e2',
    fontSize: 12,
    flex: 1,
  },
  fieldLabel: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  selectorPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectorPillActive: {
    backgroundColor: '#00f2fe',
    borderColor: '#00f2fe',
  },
  selectorPillText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 13,
  },
  selectorPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#00f2fe',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
