import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, TrendingUp, Award, Zap } from 'lucide-react-native';
import { ScoreBreakdown } from '../../backend_fastapi/schemas/feed';

interface AlgorithmScorePillProps {
  scoreBreakdown: ScoreBreakdown;
  category: string;
  sellerTier: string;
  onPress: () => void;
  isExpanded: boolean;
}

export function AlgorithmScorePill({
  scoreBreakdown,
  category,
  sellerTier,
  onPress,
  isExpanded
}: AlgorithmScorePillProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pill} onPress={onPress} activeOpacity={0.8}>
        <Sparkles size={14} color="#00f2fe" />
        <Text style={styles.pillText}>
          Algo Score: <Text style={styles.scoreHighlight}>{scoreBreakdown.final_score.toFixed(3)}</Text>
        </Text>
        {sellerTier === 'PREMIUM' && (
          <View style={styles.tierTag}>
            <Text style={styles.tierTagText}>+35% BOOST</Text>
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.breakdownBox}>
          <Text style={styles.breakdownTitle}>Algorithmic Score Inspector</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Category Affinity ({category}):</Text>
            <Text style={styles.metricVal}>+{scoreBreakdown.affinity_score.toFixed(3)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Historical Engagement:</Text>
            <Text style={styles.metricVal}>+{scoreBreakdown.engagement_score.toFixed(3)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Recency Decay Factor:</Text>
            <Text style={styles.metricVal}>+{scoreBreakdown.recency_score.toFixed(3)}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Seller Tier Multiplier:</Text>
            <Text style={[styles.metricVal, { color: sellerTier === 'PREMIUM' ? '#f59e0b' : '#9ca3af' }]}>
              {scoreBreakdown.seller_tier_multiplier}x {sellerTier === 'PREMIUM' ? '(Premium)' : ''}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 16, zIndex: 50 },
  pill: { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderWidth: 1, borderColor: '#00f2fe', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  scoreHighlight: { color: '#00f2fe', fontWeight: '800' },
  tierTag: { backgroundColor: '#f59e0b', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  tierTagText: { color: '#000000', fontSize: 9, fontWeight: '800' },
  breakdownBox: { marginTop: 8, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155', width: 260 },
  breakdownTitle: { color: '#00f2fe', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  metricLabel: { color: '#94a3b8', fontSize: 11 },
  metricVal: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});
