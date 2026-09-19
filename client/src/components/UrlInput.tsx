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

  useEffect(() => {
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) setDetectedPlatform('youtube');
    else if (u.includes('tiktok.com')) setDetectedPlatform('tiktok');
    else if (u.includes('instagram.com')) setDetectedPlatform('instagram');
    else if (u.includes('twitter.com') || u.includes('x.com')) setDetectedPlatform('twitter');
    else if (u.includes('facebook.com') || u.includes('fb.watch')) setDetectedPlatform('facebook');
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
      }
    } catch (err) {
      console.warn('Clipboard read permission denied');
    }
  };

  return (
    <div className="w-full my-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center glass-input rounded-2xl p-2 md:p-2.5 border border-zinc-800 shadow-2xl transition-all">
          <div className="flex items-center gap-3 pl-3 text-zinc-400">
            <Link2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here (YouTube, TikTok, Instagram, Facebook, X)..."
            className="w-full bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          {detectedPlatform !== 'unknown' && (
            <div className="mr-2 hidden sm:block">
              <PlatformBadge platform={detectedPlatform} />
            </div>
          )}

          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all mr-2"
          >
            <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Paste</span>
          </button>

          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 shadow-md shadow-zinc-100/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Extract Media</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
