import React from 'react';
import { HardDrive, DownloadCloud } from 'lucide-react';

interface StatusBarProps {
  downloadPath: string;
  activeCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ downloadPath, activeCount }) => {
  return (
    <footer className="h-7 bg-[#07090e] border-t border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between text-[11px] text-[rgba(240,244,248,0.5)] select-none z-30 font-mono">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[#00e676] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse" />
          <span>CORE ENGINE ONLINE</span>
        </span>

        <span className="hidden sm:flex items-center gap-1.5 text-[rgba(240,244,248,0.55)] truncate max-w-sm">
          <HardDrive className="w-3 h-3 text-[#00e5ff]" />
          <span className="truncate">{downloadPath}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {activeCount > 0 && (
          <span className="flex items-center gap-1.5 text-[#00e5ff] font-semibold animate-pulse">
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>DOWNLOADING: {activeCount} TASK(S)</span>
          </span>
        )}

        <span className="text-[rgba(240,244,248,0.35)]">
          VIDEOPILOT PRO <span className="text-[#00e5ff]">v1.2.0</span>
        </span>
      </div>
    </footer>
  );
};
