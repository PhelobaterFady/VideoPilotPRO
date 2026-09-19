import React from 'react';
import { Minus, Square, X, Download } from 'lucide-react';

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
      className="h-10 bg-black border-b border-zinc-800/80 flex items-center justify-between px-3 select-none z-50 text-zinc-300 text-xs font-medium"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-black font-bold shadow">
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <span className="font-bold text-white tracking-wide">Video Pilot Pro</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-800">
          Desktop Edition
        </span>
      </div>

      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-11 h-10 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-10 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-10 flex items-center justify-center hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
