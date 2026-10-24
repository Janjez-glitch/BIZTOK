/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Lock,
  ArrowRight,
  Clock,
  Copy,
  Check,
  Film,
  Zap,
  ShoppingBag,
  Sliders,
  Share2,
  Tag,
  PlusCircle,
  ShieldCheck,
  Award
} from 'lucide-react';
import { MerchantAccount } from '../lib/businessVerification';

interface AdStudioProps {
  merchant: MerchantAccount;
  onNavigateToVerify: () => void;
  onPublishToFeed: (productData: any) => void;
}

const PRESET_PRODUCTS = [
  {
    name: 'OrbitFlow MagSafe Dock',
    category: 'tech',
    price: 49.00,
    vibe: 'High-energy tech aesthetic, focus on CNC aluminum finish and zero cable clutter',
    image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Komorebi Speckled Stoneware',
    category: 'lifestyle',
    price: 34.00,
    vibe: 'Cozy morning ASMR, Japanese aesthetic, focus on handmade tactile glaze',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kuroki 14oz Selvedge Denim',
    category: 'fashion',
    price: 185.00,
    vibe: 'Raw streetwear luxury, vintage Toyoda shuttle loom heritage, rugged drape',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ceremonial First-Harvest Matcha',
    category: 'food',
    price: 52.00,
    vibe: 'Mindful zen ritual, vibrant electric jade froth, authentic Uji Kyoto tradition',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  }
];

export function AdStudio({ merchant, onNavigateToVerify, onPublishToFeed }: AdStudioProps) {
  const [productName, setProductName] = useState('OrbitFlow MagSafe Dock');
  const [category, setCategory] = useState('tech');
  const [sellingPoints, setSellingPoints] = useState('Foldable aerospace aluminum, 15W Qi2 fast wireless charging, magnetic ball-joint pivot');
  const [targetAudience, setTargetAudience] = useState('Modern remote workers, minimalists, Apple & Android desk enthusiasts');
  const [tone, setTone] = useState<'High-Energy TikTok' | 'Minimalist Aesthetic' | 'Problem-Solution UGC' | 'Luxury Storytelling'>('Problem-Solution UGC');
  const [discountOffer, setDiscountOffer] = useState('20% OFF with code BIZTOK20');
  const [selectedImage, setSelectedImage] = useState(PRESET_PRODUCTS[0].image);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [adResult, setAdResult] = useState<any>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handleSelectPreset = (p: typeof PRESET_PRODUCTS[0]) => {
    setProductName(p.name);
    setCategory(p.category);
    setSelectedImage(p.image);
    setSellingPoints(p.vibe);
    setCustomImageBase64(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setSelectedImage(resultStr);
      setCustomImageBase64(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAdResult(null);
    setIsPublished(false);

    try {
      const response = await fetch('/api/ads/generate-video-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          product_category: category,
          key_selling_points: sellingPoints,
          target_audience: targetAudience,
          tone,
          discount_offer: discountOffer,
          image_base64: customImageBase64 || '',
          mime_type: 'image/jpeg',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Generation failed');
      }

      setAdResult(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate ad. Please make sure merchant is verified.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCaption = () => {
    if (!adResult) return;
    const fullText = `${adResult.marketing_caption}\n\n${adResult.hashtags?.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handlePublish = () => {
    if (!adResult) return;
    setIsPublished(true);
    onPublishToFeed({
      title: productName,
      price: 49.00,
      category,
      description: adResult.marketing_caption,
      tags: adResult.hashtags?.map((t: string) => t.replace('#', '')) || ['viral', 'biztok'],
      thumbnailUrl: selectedImage,
    });
  };

  // If merchant is unverified, show strict access lock view
  if (!merchant.isVerified) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-2xl mx-auto my-6 text-center shadow-2xl flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-white">AI Ad Studio is Gated</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            BizTok strictly requires <strong className="text-zinc-200">Verified Business Registration</strong> before unlocking multimodal Gemini ad generation, video storyboard production, and automated commercial campaign publishing.
          </p>
        </div>

        <button
          onClick={onNavigateToVerify}
          className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold text-sm flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Business Identification</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Multimodal Gemini AI Ad Studio
              <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Input a product photo + creative vibe to generate an instant 15-second viral video storyboard, localized copy, and banner mockup.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Merchant: {merchant.businessName}</span>
        </div>
      </div>

      {/* Main Studio Grid: Left Form & Presets, Right Live Mockup & Script */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Builder */}
        <div className="lg:col-span-6 flex flex-col gap-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-cyan-400" /> Product Asset & Campaign Parameters
            </span>
            <span className="text-[11px] text-zinc-400">Choose preset or upload custom</span>
          </div>

          {/* Quick Presets Carousel */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Curated High-Res Product Presets:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_PRODUCTS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition ${
                    selectedImage === p.image
                      ? 'bg-cyan-950/50 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-[10px] font-bold text-zinc-200 line-clamp-1">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Upload Area */}
          <div className="relative border-2 border-dashed border-zinc-700 hover:border-cyan-400/80 rounded-2xl p-4 text-center transition flex flex-col items-center gap-2 bg-zinc-950/40">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="text-xs text-zinc-300">
              <strong className="text-cyan-400">Click to upload custom product photo</strong> or drag & drop
            </div>
            <span className="text-[10px] text-zinc-500">PNG, JPG, WEBP (Multimodal pipeline parses image features)</span>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Product Title</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
              >
                <option value="tech">Tech & Gadgets</option>
                <option value="lifestyle">Lifestyle & Home</option>
                <option value="fashion">Fashion & Apparel</option>
                <option value="food">Artisanal Food & Drink</option>
                <option value="wellness">Wellness & Beauty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Creative Selling Points & Vibe Direction
            </label>
            <textarea
              rows={2}
              value={sellingPoints}
              onChange={e => setSellingPoints(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
              placeholder="e.g. Ergonomic thumb rest, matte volcanic speckle, keep coffee warm 45min"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Tone of Voice</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Problem-Solution UGC', 'High-Energy TikTok', 'Minimalist Aesthetic', 'Luxury Storytelling'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    tone === t
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Launch Discount / Offer</label>
            <input
              type="text"
              value={discountOffer}
              onChange={e => setDiscountOffer(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Multimodal Gemini Reasoning in Progress...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Generate High-Converting 15s Ad Package</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Vertical Banner Mockup & Storyboard */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Vertical Ad Banner Mockup (9:16 mobile aspect ratio frame) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                Interactive Ad Preview Mockup
              </span>
              <span className="text-[11px] text-zinc-400">9:16 In-Feed Ad Banner</span>
            </div>

            {/* Ad Mockup Frame */}
            <div className="relative w-full max-w-[280px] h-[460px] mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-zinc-700 bg-black flex flex-col justify-between p-4">
              <img
                src={selectedImage}
                alt={productName}
                className="absolute inset-0 w-full h-full object-cover brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

              {/* Top Banner Tag */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="bg-amber-400 text-black font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Award className="w-3 h-3" /> SPONSORED AD
                </span>
                <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] px-2 py-0.5 rounded-full border border-white/20">
                  15 SEC
                </span>
              </div>

              {/* Dynamic Hook Headline Overlay (Generated by AI) */}
              <div className="relative z-10 my-auto">
                <div className="bg-black/75 backdrop-blur-md border border-amber-400/50 rounded-2xl p-3 shadow-2xl text-center transform hover:scale-105 transition">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                    HOOK (SECONDS 0-2)
                  </span>
                  <p className="text-xs font-black text-white italic leading-snug">
                    "{adResult?.viral_hook_headline || `Why is everybody on BizTok talking about this ${productName}?`}"
                  </p>
                </div>
              </div>

              {/* Bottom In-Feed Shopping Drawer Pill */}
              <div className="relative z-10 flex flex-col gap-2">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-xl">
                  <img src={selectedImage} alt={productName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{productName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-black text-emerald-400">$49.00</span>
                      <span className="text-[10px] text-zinc-400 line-through">$69.00</span>
                      <span className="text-[9px] bg-red-500 text-white font-bold px-1 rounded">
                        25% OFF
                      </span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-[11px] font-black px-2.5 py-1.5 rounded-xl shadow shrink-0 animate-pulse">
                    TAP TO BUY
                  </button>
                </div>

                {/* Instant Ingest / Publish Button */}
                {adResult && (
                  <button
                    onClick={handlePublish}
                    disabled={isPublished}
                    className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition ${
                      isPublished
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-black'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Live on Video Feed!</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Publish Video to Marketplace Feed</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated 15-Second Storyboard Script */}
          {adResult && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  15-Second Timed Storyboard Script
                </h3>
                <span className="text-xs text-zinc-400 font-mono">Audio: {adResult.recommended_audio_track_vibe}</span>
              </div>

              {/* Chronological Script Segments */}
              <div className="flex flex-col gap-3">
                {adResult.fifteen_second_script?.map((seg: any, idx: number) => (
                  <div key={idx} className="bg-zinc-950 rounded-2xl p-3.5 border border-zinc-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-cyan-400 font-mono">{seg.timestamp_range}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase">
                          {seg.phase}
                        </span>
                      </div>
                      {seg.sound_effect_cue && (
                        <span className="text-[10px] text-amber-300 font-mono">🔊 {seg.sound_effect_cue}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      <strong className="text-zinc-300">Camera / Visual:</strong> {seg.visual_direction}
                    </p>
                    <p className="text-xs text-white bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80 italic">
                      "{seg.spoken_audio}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Caption & Hashtags with Copy Button */}
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    High-Conversion Marketing Caption
                  </span>
                  <button
                    onClick={handleCopyCaption}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCaption ? 'Copied!' : 'Copy Caption & Tags'}</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                  {adResult.marketing_caption}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {adResult.hashtags?.map((tag: string) => (
                    <span key={tag} className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
