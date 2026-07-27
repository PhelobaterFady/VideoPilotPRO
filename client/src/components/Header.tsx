import React from 'react';
import { Download, History, Layers, Monitor } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface HeaderProps {
  onOpenHistory: () => void;
  isBatchMode: boolean;
  onToggleBatchMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, isBatchMode, onToggleBatchMode }) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
            <Download className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-violet-300">
                VideoPilot <span className="text-violet-400 font-extrabold">Pro</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                <Monitor className="w-3 h-3" /> Desktop & Web
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Universal Social Media Media Downloader</p>
          </div>
        </div>

        {/* Platforms Indicator Bar */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/5">
          <PlatformBadge platform="youtube" showText={false} />
          <PlatformBadge platform="tiktok" showText={false} />
          <PlatformBadge platform="instagram" showText={false} />
          <PlatformBadge platform="facebook" showText={false} />
          <PlatformBadge platform="twitter" showText={false} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleBatchMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isBatchMode
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-500'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">تحميل جماعي</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <History className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline">السجل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
