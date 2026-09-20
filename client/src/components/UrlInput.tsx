import React, { useState, useEffect } from 'react';
import { Clipboard, X, ArrowRight, Loader2, Link2 } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';
import type { PlatformType } from '../types';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>('unknown');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  useEffect(() => {
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) setDetectedPlatform('youtube');
    else if (u.includes('tiktok.com')) setDetectedPlatform('tiktok');
    else if (u.includes('instagram.com')) setDetectedPlatform('instagram');
    else if (u.includes('twitter.com') || u.includes('x.com')) setDetectedPlatform('twitter');
    else if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.gg')) setDetectedPlatform('facebook');
    else setDetectedPlatform('unknown');
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 1500);
      }
    } catch (err) {
      console.warn('Clipboard read permission denied');
    }
  };

  return (
    <div className="w-full my-2">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center hud-input-bay rounded-2xl p-2 md:p-2.5 border border-white/[0.1] shadow-2xl">
          {/* Signal Indicator */}
          <div className="flex items-center gap-2 pl-3 text-[#8290A5]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#00E5FF]">
              <Link2 className="w-4 h-4" />
            </div>
          </div>

          {/* Main Link Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste media link (YouTube 4K/Shorts, TikTok, Instagram Reel, Facebook, X)..."
            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-[#607085] focus:outline-none font-medium"
          />

          {/* Detected Platform Tag */}
          {detectedPlatform !== 'unknown' && (
            <div className="mr-2 hidden sm:block">
              <PlatformBadge platform={detectedPlatform} />
            </div>
          )}

          {/* Clear Button */}
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="p-2 text-[#8290A5] hover:text-white transition-colors mr-1"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Quick Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all mr-2 border ${
              pasteSuccess
                ? 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border-white/[0.08]'
            }`}
            title="Paste from clipboard (Ctrl+V)"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
          </button>

          {/* Analyze / Engage Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display text-xs font-bold transition-all shadow-lg select-none flex-shrink-0 ${
              url.trim() && !isLoading
                ? 'bg-[#00E5FF] hover:bg-[#33ebff] text-black shadow-cyan-500/25 active:scale-[0.98]'
                : 'bg-white/[0.06] text-[#607085] cursor-not-allowed border border-white/[0.05]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span className="font-mono">Analyzing...</span>
              </>
            ) : (
              <>
                <span>Inspect Media</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
