/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Code2,
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Smartphone,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';

export function CodeExplorer() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('backend_fastapi/middleware/merchant_verification.py');
  const [activeTab, setActiveTab] = useState<'backend' | 'mobile' | 'architecture'>('backend');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/codebase/files')
      .then(res => res.json())
      .then(data => {
        setFiles(data);
      })
      .catch(err => console.error(err));
  }, []);

  const backendFiles = Object.keys(files).filter(k => k.startsWith('backend_fastapi/'));
  const mobileFiles = Object.keys(files).filter(k => k.startsWith('mobile_expo/'));

  const handleCopyCode = () => {
    if (!files[selectedFile]) return;
    navigator.clipboard.writeText(files[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-white max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Full-Stack Architecture & Modular Code Hub
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                FastAPI + React Native Expo
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Clean modular code structured per real-world production specifications
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('backend');
              if (backendFiles.length > 0) setSelectedFile(backendFiles[0]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'backend' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Python / FastAPI</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mobile');
              if (mobileFiles.length > 0) setSelectedFile(mobileFiles[0]);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'mobile' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>React Native / Expo</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'architecture' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>System Data Flow</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'architecture' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Onboarding Gate Flow */}
            <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="text-sm font-bold text-white">Verified Business Gate</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Merchant submits legal registration ID (EIN/VAT/CRN/UEN). The <code className="text-cyan-300">require_verified_merchant</code> dependency validates checksums against jurisdiction rules. If unverified, endpoints return <code className="text-red-400 font-bold">403 FORBIDDEN</code>.
              </p>
              <div className="mt-auto bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
                Client → POST /verify → Regex & IRS Prefix Check → DB Session Verified = true
              </div>
            </div>

            {/* 2. Algorithmic Feed Ranking Flow */}
            <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="text-sm font-bold text-white">Algorithmic Feed Engine</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every swipe sends micro-behavior telemetry (fast skip &lt; 2s vs full loop &gt; 8s vs like vs buy). Updates category affinity vector via exponential moving average. Candidate scoring applies:
                <br />
                <code className="text-amber-300 font-mono text-[11px]">Score = (w_aff·Aff + w_eng·Eng + w_rec·Rec) × 1.35 (Premium Tier)</code>
              </p>
              <div className="mt-auto bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
                Swipe Gesture → Affinity Delta → Re-rank → Diversity Smoothing → FlatList
              </div>
            </div>

            {/* 3. Gemini Multimodal Ad Pipeline */}
            <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-xs font-bold flex items-center justify-center">3</span>
                <h4 className="text-sm font-bold text-white">Multimodal Gemini Ad Studio</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Gated behind merchant verification. Ingests product image base64 + text prompt. Calls Gemini 3.8 Flash with structured JSON schema to generate 15s timed storyboard, viral hook, and localized captions.
              </p>
              <div className="mt-auto bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
                Image + Vibe → Gemini 3.8 Flash → 15s Storyboard → Publish to Feed
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* File Tree & Code Viewer */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* File Tree Sidebar */}
          <div className="md:col-span-4 bg-zinc-950 rounded-2xl p-3 border border-zinc-800 flex flex-col gap-1 max-h-[500px] overflow-y-auto">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1">
              {activeTab === 'backend' ? 'Python / FastAPI Source Files' : 'React Native / Expo Source Files'}
            </span>

            {(activeTab === 'backend' ? backendFiles : mobileFiles).map(file => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-mono transition ${
                  selectedFile === file
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span className="truncate">{file.split('/').slice(1).join('/')}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-8 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col shadow-inner">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                {selectedFile}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[460px] leading-relaxed">
              <code>{files[selectedFile] || '# Loading code file...'}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
