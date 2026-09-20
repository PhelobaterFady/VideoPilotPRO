import React from 'react';
import { Minus, Square, X, Compass } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-maximize');
    }
  };

  const handleClose = () => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('window-close');
    }
  };

  return (
    <div
      className="h-10 bg-[#07090E]/95 border-b border-white/[0.08] flex items-center justify-between px-3 select-none z-50 text-zinc-300 text-xs font-medium backdrop-blur-md"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center text-black font-bold shadow-md shadow-cyan-500/20">
          <Compass className="w-3.5 h-3.5 text-black stroke-[2.5]" />
        </div>
        <span className="font-display font-bold text-white tracking-tight text-[13px]">
          Video Pilot <span className="text-[#00E5FF]">Pro</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#8290A5] font-mono border border-white/[0.08] hidden sm:inline-block">
          Studio Deck
        </span>
      </div>

      {/* Center Telemetry Status */}
      <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0E131F]/90 border border-white/[0.06] text-[11px] font-mono text-[#8290A5]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
        <span className="text-zinc-300 font-semibold">Engine Online</span>
        <span className="text-zinc-600">|</span>
        <span>FFmpeg Active</span>
      </div>

      {/* Window Controls */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center hover:bg-red-500 text-zinc-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
