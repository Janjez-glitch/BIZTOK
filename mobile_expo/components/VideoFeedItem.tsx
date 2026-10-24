import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Heart, MessageCircle, Share2, ShoppingBag, Volume2, VolumeX, ShieldCheck, Award } from 'lucide-react-native';
import { RankedFeedItem } from '../../backend_fastapi/schemas/feed';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

interface VideoFeedItemProps {
  item: RankedFeedItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDrawer: () => void;
  onLike: () => void;
}

export function VideoFeedItem({
  item,
  isActive,
  isMuted,
  onToggleMute,
  onOpenDrawer,
  onLike
}: VideoFeedItemProps) {
  const { product, scoreBreakdown } = item;

  return (
    <View style={styles.container}>
      {/* Background Media / Video Simulation */}
      <Image
        source={{ uri: product.thumbnailUrl }}
        style={styles.videoBackground}
        resizeMode="cover"
      />
      <View style={styles.darkGradientOverlay} />

      {/* Top Controls: Mute Toggle */}
      <TouchableOpacity style={styles.muteButton} onPress={onToggleMute}>
        {isMuted ? <VolumeX size={18} color="#ffffff" /> : <Volume2 size={18} color="#ffffff" />}
      </TouchableOpacity>

      {/* Right Action Bar */}
      <View style={styles.rightActionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <View style={styles.iconCircle}>
            <Heart size={22} color="#ffffff" fill="#ef4444" />
          </View>
          <Text style={styles.actionText}>{product.baseLikes.toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconCircle}>
            <MessageCircle size={22} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>342</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.iconCircle}>
            <Share2 size={22} color="#ffffff" />
          </View>
          <Text style={styles.actionText}>{product.baseShares.toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenDrawer}>
          <View style={[styles.iconCircle, styles.shopCircle]}>
            <ShoppingBag size={22} color="#000000" />
          </View>
          <Text style={[styles.actionText, { color: '#f59e0b', fontWeight: '700' }]}>Shop</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Content Area */}
      <View style={styles.bottomContent}>
        {/* Creator Identity with Verified Badge */}
        <View style={styles.creatorRow}>
          <Image source={{ uri: product.sellerAvatar }} style={styles.avatar} />
          <Text style={styles.sellerName}>@{product.sellerName.replace(/\s+/g, '').toLowerCase()}</Text>
          {product.isSellerVerified && (
            <ShieldCheck size={16} color="#10b981" />
          )}
          {product.sellerTier === 'PREMIUM' && (
            <View style={styles.premiumBadge}>
              <Award size={12} color="#000000" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Video Caption & Hashtags */}
        <Text style={styles.captionText} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={styles.tagsText}>
          {product.tags.map(t => `#${t}`).join(' ')}
        </Text>

        {/* Interactive Floating Product Tag */}
        <TouchableOpacity style={styles.productTagPill} onPress={onOpenDrawer} activeOpacity={0.85}>
          <Image source={{ uri: product.thumbnailUrl }} style={styles.productPillThumb} />
          <View style={styles.productPillInfo}>
            <Text style={styles.productPillTitle} numberOfLines={1}>
              {product.title}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>${product.price.toFixed(2)}</Text>
              {product.originalPrice && (
                <Text style={styles.oldPrice}>${product.originalPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>
          <View style={styles.pillBuyButton}>
            <Text style={styles.pillBuyButtonText}>BUY</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT - 72,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  rightActionBar: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20,20,25,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCircle: {
    backgroundColor: '#f59e0b',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    width: WINDOW_WIDTH - 60,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  sellerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  premiumBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  captionText: {
    color: '#f3f4f6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  tagsText: {
    color: '#00f2fe',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  productTagPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 10,
  },
  productPillThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  productPillInfo: {
    flex: 1,
  },
  productPillTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  currentPrice: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  oldPrice: {
    color: '#9ca3af',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  pillBuyButton: {
    backgroundColor: '#00f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillBuyButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
});
