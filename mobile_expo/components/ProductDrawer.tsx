import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { X, Check, ShieldCheck, Truck, Star } from 'lucide-react-native';

interface ProductDrawerProps {
  product: any;
  onClose: () => void;
  onBuySuccess: () => void;
}

export function ProductDrawer({ product, onClose, onBuySuccess }: ProductDrawerProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);

  const handleCheckout = () => {
    setIsPurchased(true);
    setTimeout(() => {
      onBuySuccess();
    }, 1200);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Instant 1-Tap Checkout</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.productSummary}>
          <Image source={{ uri: product.thumbnailUrl }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <View style={styles.sellerRow}>
              <Text style={styles.sellerName}>Sold by {product.sellerName}</Text>
              {product.isSellerVerified && <ShieldCheck size={14} color="#10b981" />}
            </View>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Value props */}
        <View style={styles.trustBadges}>
          <View style={styles.badgeItem}>
            <Truck size={14} color="#00f2fe" />
            <Text style={styles.badgeText}>Express 2-Day Air</Text>
          </View>
          <View style={styles.badgeItem}>
            <ShieldCheck size={14} color="#10b981" />
            <Text style={styles.badgeText}>Verified Business Escrow</Text>
          </View>
        </View>

        {/* Instant Checkout Button */}
        <TouchableOpacity
          style={[styles.checkoutBtn, isPurchased && styles.checkoutBtnSuccess]}
          onPress={handleCheckout}
          disabled={isPurchased}
        >
          {isPurchased ? (
            <View style={styles.btnRow}>
              <Check size={20} color="#ffffff" />
              <Text style={styles.checkoutBtnText}>Order Confirmed!</Text>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.checkoutBtnText}>Complete Instant Purchase • ${product.price.toFixed(2)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#374151' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  productSummary: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  productImage: { width: 72, height: 72, borderRadius: 10 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sellerName: { color: '#9ca3af', fontSize: 12 },
  price: { color: '#10b981', fontSize: 16, fontWeight: '800' },
  trustBadges: { flexDirection: 'row', gap: 12, backgroundColor: '#1f2937', borderRadius: 8, padding: 10, marginBottom: 18 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: '#d1d5db', fontSize: 11, fontWeight: '500' },
  checkoutBtn: { backgroundColor: '#00f2fe', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnSuccess: { backgroundColor: '#10b981' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutBtnText: { color: '#000000', fontSize: 14, fontWeight: '800' },
});
