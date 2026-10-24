/**
 * BizTok Mobile - Root React Native / Expo Application
 * Video-first mobile shopping marketplace with verified business onboarding,
 * algorithmic recommendation feed, and multimodal AI ad generator.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Video, ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react-native';

import { FeedScreen } from './screens/FeedScreen';
import { MerchantOnboardingScreen } from './screens/MerchantOnboardingScreen';
import { AdStudioScreen } from './screens/AdStudioScreen';

export type TabKey = 'feed' | 'studio' | 'merchant';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [isMerchantVerified, setIsMerchantVerified] = useState<boolean>(false);
  const [merchantTier, setMerchantTier] = useState<'STANDARD' | 'PREMIUM'>('PREMIUM');

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Tab Content */}
        <View style={styles.screenWrapper}>
          {activeTab === 'feed' && <FeedScreen onOpenShop={() => setActiveTab('feed')} />}
          {activeTab === 'studio' && (
            <AdStudioScreen
              isVerified={isMerchantVerified}
              onNavigateToOnboarding={() => setActiveTab('merchant')}
            />
          )}
          {activeTab === 'merchant' && (
            <MerchantOnboardingScreen
              isVerified={isMerchantVerified}
              tier={merchantTier}
              onVerificationSuccess={() => setIsMerchantVerified(true)}
              onToggleTier={() => setMerchantTier(t => t === 'PREMIUM' ? 'STANDARD' : 'PREMIUM')}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('feed')}
            activeOpacity={0.7}
          >
            <Video size={24} color={activeTab === 'feed' ? '#00f2fe' : '#888888'} />
            <Text style={[styles.tabLabel, activeTab === 'feed' && styles.activeTabLabel]}>
              Shop Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('studio')}
            activeOpacity={0.7}
          >
            <Sparkles size={24} color={activeTab === 'studio' ? '#f59e0b' : '#888888'} />
            <Text style={[styles.tabLabel, activeTab === 'studio' && styles.activeTabLabel]}>
              AI Ad Studio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('merchant')}
            activeOpacity={0.7}
          >
            <ShieldCheck size={24} color={activeTab === 'merchant' ? '#10b981' : '#888888'} />
            <Text style={[styles.tabLabel, activeTab === 'merchant' && styles.activeTabLabel]}>
              {isMerchantVerified ? 'Seller Hub' : 'Verify Biz'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenWrapper: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#0a0a0c',
    borderTopWidth: 1,
    borderTopColor: '#1f1f23',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#ffffff',
  },
});
