import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ViewToken
} from 'react-native';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Sparkles, ShoppingBag } from 'lucide-react-native';
import { VideoFeedItem } from '../components/VideoFeedItem';
import { ProductDrawer } from '../components/ProductDrawer';
import { AlgorithmScorePill } from '../components/AlgorithmScorePill';
import { useFeedAlgorithm } from '../hooks/useFeedAlgorithm';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

interface FeedScreenProps {
  onOpenShop: () => void;
}

export function FeedScreen({ onOpenShop }: FeedScreenProps) {
  const {
    rankedItems,
    isLoading,
    activeIndex,
    setActiveIndex,
    recordInteraction,
    userAffinity,
  } = useFeedAlgorithm();

  const [isMuted, setIsMuted] = useState(true);
  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<any>(null);
  const [showInspector, setShowInspector] = useState(false);
  const watchStartTimeRef = useRef<number>(Date.now());

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      // Record telemetry for previous video
      if (rankedItems[activeIndex]) {
        const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000;
        const currentItem = rankedItems[activeIndex];
        const action = watchDuration < 2.0 ? 'SKIP_FAST' : (watchDuration > 8.0 ? 'WATCH_COMPLETE' : 'WATCH_PARTIAL');

        recordInteraction({
          productId: currentItem.product.id,
          category: currentItem.product.category,
          watchTimeSeconds: watchDuration,
          videoDurationSeconds: 15,
          action,
        });
      }

      watchStartTimeRef.current = Date.now();
      setActiveIndex(newIndex);
    }
  }).current;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00f2fe" />
        <Text style={styles.loadingText}>Ranking algorithmic feed...</Text>
      </View>
    );
  }

  const currentItem = rankedItems[activeIndex];

  return (
    <View style={styles.container}>
      <FlatList
        data={rankedItems}
        keyExtractor={item => item.product.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={WINDOW_HEIGHT - 72}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 75 }}
        renderItem={({ item, index }) => (
          <VideoFeedItem
            item={item}
            isActive={index === activeIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(m => !m)}
            onOpenDrawer={() => {
              setSelectedProductForDrawer(item.product);
              recordInteraction({
                productId: item.product.id,
                category: item.product.category,
                watchTimeSeconds: (Date.now() - watchStartTimeRef.current) / 1000,
                videoDurationSeconds: 15,
                action: 'OPEN_DRAWER',
              });
            }}
            onLike={() => {
              recordInteraction({
                productId: item.product.id,
                category: item.product.category,
                watchTimeSeconds: (Date.now() - watchStartTimeRef.current) / 1000,
                videoDurationSeconds: 15,
                action: 'LIKE',
              });
            }}
          />
        )}
      />

      {/* Floating Algorithmic Score Badge */}
      {currentItem && (
        <AlgorithmScorePill
          scoreBreakdown={currentItem.scoreBreakdown}
          category={currentItem.product.category}
          sellerTier={currentItem.product.sellerTier}
          onPress={() => setShowInspector(prev => !prev)}
          isExpanded={showInspector}
        />
      )}

      {/* Product Drawer Bottom Sheet */}
      {selectedProductForDrawer && (
        <ProductDrawer
          product={selectedProductForDrawer}
          onClose={() => setSelectedProductForDrawer(null)}
          onBuySuccess={() => {
            recordInteraction({
              productId: selectedProductForDrawer.id,
              category: selectedProductForDrawer.category,
              watchTimeSeconds: 15,
              videoDurationSeconds: 15,
              action: 'BUY',
            });
            setSelectedProductForDrawer(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
