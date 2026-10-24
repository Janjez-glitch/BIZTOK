/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Send, Share2 } from 'lucide-react';

interface ShareModalProps {
  productTitle: string;
  onClose: () => void;
}

export function ShareModal({ productTitle, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareLink = `https://biztok.app/p/${encodeURIComponent(productTitle.replace(/\s+/g, '-').toLowerCase())}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-zinc-900 border-t border-zinc-700 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-zinc-300">Share Video Product</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick share channels */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-300">Copy Link</span>
          </button>

          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-300">WhatsApp</span>
          </button>

          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-300">Telegram</span>
          </button>

          <button onClick={handleCopy} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-300">SMS</span>
          </button>
        </div>

        {/* Direct Link Box */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
          <span className="text-xs text-zinc-400 truncate flex-1 font-mono">{shareLink}</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
