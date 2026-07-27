import React from 'react';
import { Folder, CheckCircle, DownloadCloud } from 'lucide-react';

interface StatusBarProps {
  downloadPath: string;
  activeCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ downloadPath, activeCount }) => {
  return (
    <footer className="h-7 bg-black border-t border-zinc-800/80 px-4 flex items-center justify-between text-[11px] text-zinc-400 select-none z-30">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <CheckCircle className="w-3 h-3" />
          <span>Server Engine Online</span>
        </span>

        <span className="hidden sm:flex items-center gap-1 text-zinc-400 truncate max-w-xs">
          <Folder className="w-3 h-3 text-emerald-400" />
          <span className="truncate">{downloadPath}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {activeCount > 0 && (
          <span className="flex items-center gap-1 text-cyan-400 font-bold animate-pulse">
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Downloading {activeCount} item(s)</span>
          </span>
        )}

        <span className="font-mono text-zinc-500">v1.0.0 PC Edition</span>
      </div>
    </footer>
  );
};
