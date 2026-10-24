import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Sparkles, Camera, Image as ImageIcon, Lock, ArrowRight, Check, Copy, Clock, Film } from 'lucide-react-native';

interface AdStudioScreenProps {
  isVerified: boolean;
  onNavigateToOnboarding: () => void;
}

export function AdStudioScreen({ isVerified, onNavigateToOnboarding }: AdStudioScreenProps) {
  const [productName, setProductName] = useState('OrbitFlow MagSafe Dock');
  const [sellingPoints, setSellingPoints] = useState('Aircraft grade aluminum, 15W fast wireless charging, foldable pocket design');
  const [targetAudience, setTargetAudience] = useState('Tech workers, remote creators, desk setup enthusiasts');
  const [tone, setTone] = useState<'High-Energy TikTok' | 'Minimalist Aesthetic' | 'Problem-Solution UGC' | 'Luxury Storytelling'>('Problem-Solution UGC');
  const [discount, setDiscount] = useState('25% OFF with code BIZTOK25');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adResult, setAdResult] = useState<any>(null);

  // Default product image preset
  const [selectedImage, setSelectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80'
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAdResult(null);

    try {
      const response = await fetch('/api/ads/generate-video-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          product_category: 'tech',
          key_selling_points: sellingPoints,
          target_audience: targetAudience,
          tone,
          discount_offer: discount,
          image_base64: 'sample_base64_encoded_image',
          mime_type: 'image/jpeg'
        }),
      });

      const data = await response.json();
      setAdResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isVerified) {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateCard}>
          <Lock size={36} color="#ef4444" />
          <Text style={styles.gateTitle}>Verified Business Access Required</Text>
          <Text style={styles.gateDesc}>
            The Gemini Multimodal AI Ad Generator is reserved exclusively for verified commercial merchants. Please complete business identification verification first.
          </Text>
          <TouchableOpacity style={styles.gateBtn} onPress={onNavigateToOnboarding}>
            <Text style={styles.gateBtnText}>Go to Business Onboarding</Text>
            <ArrowRight size={18} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Sparkles size={24} color="#f59e0b" />
          <Text style={styles.headerTitle}>Multimodal Gemini AI Ad Studio</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Upload your product still. Gemini 3.8 Flash will generate viral short-form hooks, a localized caption, and an exact 15-second timed video script.
        </Text>
      </View>

      {/* Product Image Preview */}
      <View style={styles.imageCard}>
        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        <View style={styles.imageOverlayControls}>
          <TouchableOpacity style={styles.imageSelectBtn}>
            <ImageIcon size={16} color="#ffffff" />
            <Text style={styles.imageSelectBtnText}>Upload Product Still</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form Fields */}
      <Text style={styles.label}>Product Name</Text>
      <TextInput style={styles.input} value={productName} onChangeText={setProductName} />

      <Text style={styles.label}>Core Selling Points</Text>
      <TextInput style={[styles.input, styles.textArea]} value={sellingPoints} onChangeText={setSellingPoints} multiline />

      <Text style={styles.label}>Target Audience</Text>
      <TextInput style={styles.input} value={targetAudience} onChangeText={setTargetAudience} />

      <Text style={styles.label}>Creative Tone</Text>
      <View style={styles.toneRow}>
        {(['Problem-Solution UGC', 'High-Energy TikTok', 'Minimalist Aesthetic'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tonePill, tone === t && styles.tonePillActive]}
            onPress={() => setTone(t)}
          >
            <Text style={[styles.tonePillText, tone === t && styles.tonePillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <>
            <Sparkles size={20} color="#000000" />
            <Text style={styles.generateButtonText}>Generate 15-Sec Ad Script & Package</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Generated Result Storyboard */}
      {adResult && (
        <View style={styles.resultCard}>
          <View style={styles.hookBox}>
            <Text style={styles.hookLabel}>VIRAL HOOK OVERLAY</Text>
            <Text style={styles.hookText}>"{adResult.viral_hook_headline}"</Text>
          </View>

          <Text style={styles.sectionHeading}>15-Second Timed Video Script</Text>
          {adResult.fifteen_second_script?.map((seg: any, idx: number) => (
            <View key={idx} style={styles.scriptSegment}>
              <View style={styles.segmentHeader}>
                <Clock size={14} color="#00f2fe" />
                <Text style={styles.segmentTime}>{seg.timestamp_range}</Text>
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseBadgeText}>{seg.phase}</Text>
                </View>
              </View>
              <Text style={styles.segmentVisual}>🎥 Visual: {seg.visual_direction}</Text>
              <Text style={styles.segmentSpoken}>🎙️ Audio: "{seg.spoken_audio}"</Text>
            </View>
          ))}

          <Text style={styles.sectionHeading}>Marketing Caption & Hashtags</Text>
          <View style={styles.captionBox}>
            <Text style={styles.captionText}>{adResult.marketing_caption}</Text>
            <View style={styles.hashtagRow}>
              {adResult.hashtags?.map((tag: string, i: number) => (
                <Text key={i} style={styles.hashtagItem}>{tag} </Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 18 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  gateContainer: { flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', padding: 24 },
  gateCard: { backgroundColor: '#111827', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  gateTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  gateDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  gateBtn: { backgroundColor: '#ef4444', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  gateBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  imageCard: { height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  imageOverlayControls: { position: 'absolute', bottom: 10, right: 10 },
  imageSelectBtn: { backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  imageSelectBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  label: { color: '#d1d5db', fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#111827', borderRadius: 10, color: '#ffffff', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#1f2937' },
  textArea: { height: 60, textAlignVertical: 'top' },
  toneRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tonePill: { flex: 1, backgroundColor: '#111827', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
  tonePillActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  tonePillText: { color: '#9ca3af', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tonePillTextActive: { color: '#f59e0b', fontWeight: '700' },
  generateButton: { backgroundColor: '#f59e0b', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 10 },
  generateButtonText: { color: '#000000', fontWeight: '700', fontSize: 14 },
  resultCard: { backgroundColor: '#111827', borderRadius: 16, padding: 18, marginTop: 24, borderWidth: 1, borderColor: '#f59e0b' },
  hookBox: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f59e0b', marginBottom: 16 },
  hookLabel: { color: '#f59e0b', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  hookText: { color: '#ffffff', fontSize: 15, fontWeight: '700', fontStyle: 'italic' },
  sectionHeading: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginBottom: 10, marginTop: 10 },
  scriptSegment: { backgroundColor: '#1f2937', borderRadius: 10, padding: 12, marginBottom: 10 },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  segmentTime: { color: '#00f2fe', fontSize: 12, fontWeight: '700' },
  phaseBadge: { backgroundColor: '#374151', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 'auto' },
  phaseBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  segmentVisual: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  segmentSpoken: { color: '#e5e7eb', fontSize: 13, fontWeight: '500' },
  captionBox: { backgroundColor: '#1f2937', borderRadius: 10, padding: 12 },
  captionText: { color: '#d1d5db', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  hashtagItem: { color: '#00f2fe', fontSize: 12, fontWeight: '600' },
});
