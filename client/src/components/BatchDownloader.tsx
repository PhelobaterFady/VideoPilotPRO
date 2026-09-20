import React, { useState } from 'react';
import { Layers, Loader2, X, ArrowRight } from 'lucide-react';

interface BatchDownloaderProps {
  onAnalyzeBatch: (urls: string[]) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const BatchDownloader: React.FC<BatchDownloaderProps> = ({ onAnalyzeBatch, isLoading, onClose }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = text
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')));

    if (urls.length > 0 && !isLoading) {
      onAnalyzeBatch(urls);
    }
  };

  const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;

  return (
    <div className="w-full my-4 cockpit-card rounded-3xl p-5 md:p-6 border border-white/[0.08] shadow-2xl relative tab-content-enter">
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 text-[#8290A5] hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
        title="Close Batch Bay"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20 shadow-md shadow-cyan-500/10">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold text-white tracking-tight">Batch Mission Queue</h3>
            {lineCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-bold">
                {lineCount} links queued
              </span>
            )}
          </div>
          <p className="text-xs text-[#8290A5]">Paste multiple media links (one per line) for concurrent ingestion and download</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@creator/video/...\nhttps://www.instagram.com/reel/...`}
            className="w-full bg-[#07090E] text-white text-xs rounded-2xl p-4 border border-white/[0.08] focus:outline-none focus:border-[#00E5FF] font-mono leading-relaxed placeholder-[#607085]"
          ></textarea>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] font-mono text-[#8290A5]">
            Supports mixed feeds (YouTube, TikTok, Reels, Facebook)
          </span>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-display text-xs font-bold bg-[#00E5FF] hover:bg-[#33ebff] text-black shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all select-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span className="font-mono">Processing Queue...</span>
              </>
            ) : (
              <>
                <span>Engage Batch Analysis</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
