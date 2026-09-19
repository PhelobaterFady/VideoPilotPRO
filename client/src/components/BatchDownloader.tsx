import React, { useState } from 'react';
import { Layers, Loader2, Sparkles, X } from 'lucide-react';

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

  return (
    <div className="w-full my-4 glass-card rounded-3xl p-6 border border-zinc-800 shadow-2xl relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Batch Multi-Link Downloader</h3>
          <p className="text-xs text-zinc-400">Paste multiple URLs (one link per line) to analyze and download in batch</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.tiktok.com/@user/video/...\nhttps://www.instagram.com/reel/...`}
          className="w-full bg-zinc-950 text-zinc-100 text-xs rounded-2xl p-4 border border-zinc-800 focus:outline-none focus:border-emerald-500 font-mono"
        ></textarea>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 shadow-md shadow-zinc-100/10 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Analyze All Links</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
