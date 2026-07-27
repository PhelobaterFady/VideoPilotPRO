import React from 'react';
import { Download, Layers, History, Settings, Film, CheckCircle2 } from 'lucide-react';

export type TabType = 'downloader' | 'batch' | 'history' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeDownloadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, activeDownloadsCount }) => {
  const navItems = [
    { id: 'downloader' as TabType, label: 'Direct Downloader', icon: Download },
    { id: 'batch' as TabType, label: 'Batch Downloader', icon: Layers },
    { id: 'history' as TabType, label: 'Downloads History', icon: History },
    { id: 'settings' as TabType, label: 'Settings & Storage', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-800/80 flex flex-col justify-between p-4 select-none flex-shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-zinc-100/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'downloader' && activeDownloadsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-black font-bold animate-pulse">
                      {activeDownloadsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800">
          <p className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supported Platforms</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5 bg-black px-2 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> YouTube
            </div>
            <div className="flex items-center gap-1.5 bg-black px-2 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> TikTok
            </div>
            <div className="flex items-center gap-1.5 bg-black px-2 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span> Instagram
            </div>
            <div className="flex items-center gap-1.5 bg-black px-2 py-1.5 rounded-lg border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Facebook
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div className="truncate">
          <p className="text-[11px] font-semibold text-zinc-200">yt-dlp Engine Ready</p>
          <p className="text-[10px] text-zinc-500 truncate">v2026.07.04 Active</p>
        </div>
      </div>
    </aside>
  );
};
