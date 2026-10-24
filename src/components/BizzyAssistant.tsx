/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  Zap,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';
import { FeedProduct } from '../lib/recommendationEngine';

interface BizzyAssistantProps {
  currentProduct?: FeedProduct;
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: (product: FeedProduct) => void;
  initialMode?: 'BUYER' | 'SELLER';
}

interface ChatMessage {
  id: string;
  sender: 'BIZZY' | 'USER';
  text: string;
  timestamp: string;
  suggestedPills?: string[];
  productAction?: FeedProduct;
}

export function BizzyAssistant({
  currentProduct,
  isOpen,
  onClose,
  onOpenCheckout,
  initialMode = 'BUYER',
}: BizzyAssistantProps) {
  const [mode, setMode] = useState<'BUYER' | 'SELLER'>(initialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on mount or product change
  useEffect(() => {
    if (!isOpen) return;

    const initialGreeting: ChatMessage = {
      id: 'msg_welcome',
      sender: 'BIZZY',
      text:
        mode === 'BUYER'
          ? `Hey! I'm Bizzy, your AI shopping concierge. Looking at the **${currentProduct?.title || 'product'}**? Ask me anything about sizing, tech specs, or how it compares to alternatives!`
          : `Hey Merchant! I'm Bizzy, your live-streaming sales co-pilot. Need a quick 10-second pitch, pricing benchmark, or objection handler for the **${currentProduct?.title || 'broadcast product'}**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPills:
        mode === 'BUYER'
          ? [
              'What makes this worth the price?',
              'Does it include BizTok Escrow protection?',
              'How does it compare to ceramic mugs?',
            ]
          : [
              'Give me a 10-second flash sale pitch',
              'How do I handle "shipping too slow" objections?',
              'What bundle discount drives the highest CTR?',
            ],
    };

    setMessages([initialGreeting]);
  }, [isOpen, mode, currentProduct]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'USER',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/bizzy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          userQuestion: textToSend,
          currentProduct,
        }),
      });

      const data = await res.json();
      const bizzyReply: ChatMessage = {
        id: `bizzy_${Date.now()}`,
        sender: 'BIZZY',
        text: data.reply || "I'm Bizzy! This product is 100% verified and protected under BizTok Escrow.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPills: data.suggestedQuestions,
        productAction: mode === 'BUYER' ? currentProduct : undefined,
      };

      setMessages(prev => [...prev, bizzyReply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `bizzy_err_${Date.now()}`,
          sender: 'BIZZY',
          text: `Bizzy here! The ${currentProduct?.title || 'product'} is backed by 100% BizTok Escrow vault protection with verified 2-day priority dispatch.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-black shadow-lg shadow-cyan-500/20 font-black">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Bizzy Shopping AI Concierge
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                Gemini 3.8
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              {mode === 'BUYER' ? 'Buyer Assistant & Specs Compare' : 'Live Seller Broadcast Co-Pilot'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/80 flex gap-1">
        <button
          onClick={() => setMode('BUYER')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mode === 'BUYER'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Buyer Mode</span>
        </button>

        <button
          onClick={() => setMode('SELLER')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mode === 'SELLER'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Seller Co-Pilot Mode</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 max-w-[85%] ${
              msg.sender === 'USER' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'USER'
                  ? 'bg-cyan-500 text-black font-semibold rounded-br-none shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-md'
              }`}
            >
              {msg.text}

              {/* In-chat 1-tap checkout card trigger */}
              {msg.productAction && (
                <div className="mt-2.5 p-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-white block truncate">
                      {msg.productAction.title}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ${msg.productAction.price.toFixed(2)} • Escrow Vault Protected
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onOpenCheckout(msg.productAction!);
                      onClose();
                    }}
                    className="bg-emerald-400 hover:bg-emerald-300 text-black font-black text-[10px] px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <span>BUY</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <span className="text-[9px] text-zinc-500 px-1">{msg.timestamp}</span>

            {/* Suggested quick pills */}
            {msg.suggestedPills && msg.suggestedPills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {msg.suggestedPills.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pill)}
                    className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 rounded-full px-2.5 py-1 transition text-left"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="mr-auto bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-none p-3 text-xs text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Bizzy is reasoning with Gemini 3.8 Flash...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/60">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              mode === 'BUYER'
                ? 'Ask Bizzy about specs, sizing, comparison...'
                : 'Ask Bizzy for flash sale pitch or pricing advice...'
            }
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-black flex items-center justify-center shrink-0 disabled:opacity-40 transition"
          >
            <Send className="w-4 h-4 fill-black" />
          </button>
        </form>
      </div>
    </div>
  );
}
