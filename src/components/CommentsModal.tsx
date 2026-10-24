/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Heart, ShieldCheck, Check } from 'lucide-react';

interface CommentsModalProps {
  productTitle: string;
  onClose: () => void;
}

const INITIAL_COMMENTS = [
  { id: 1, user: 'tech_minimalist', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80', text: 'Does this work with standard MagSafe cases?', time: '2h ago', likes: 14 },
  { id: 2, user: 'coffee_artisan', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80', text: 'The build quality is insane. Arrived in 2 days from verified merchant!', time: '4h ago', likes: 38 },
  { id: 3, user: 'sarah_design', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80', text: 'Just ordered with the 20% discount tag below 🔥', time: '5h ago', likes: 9 },
];

export function CommentsModal({ productTitle, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments(prev => [
      ...prev,
      {
        id: Date.now(),
        user: 'you',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
        text: newComment.trim(),
        time: 'Just now',
        likes: 0,
      }
    ]);
    setNewComment('');
  };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end">
      <div className="bg-zinc-900 border-t border-zinc-700 rounded-t-3xl p-4 shadow-2xl flex flex-col gap-3 max-h-[75%] h-[420px]">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-zinc-300">
            {comments.length} Comments • {productTitle}
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5 items-start text-xs">
              <img src={c.avatar} alt={c.user} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-200">@{c.user}</span>
                  <span className="text-[10px] text-zinc-500">{c.time}</span>
                </div>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">{c.text}</p>
              </div>
              <button className="text-zinc-500 hover:text-red-400 flex flex-col items-center">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-[9px] mt-0.5">{c.likes}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-zinc-800">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment on this product..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
          <button type="submit" className="w-9 h-9 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
