import React from 'react';
import { Download, Layers, History, Settings, Film, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export type TabType = 'downloader' | 'batch' | 'history' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeDownloadsCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeDownloadsCount,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const navItems = [
    { id: 'downloader' as TabType, label: 'Direct Downloader', icon: Download },
    { id: 'batch' as TabType, label: 'Batch Downloader', icon: Layers },
    { id: 'history' as TabType, label: 'Downloads History', icon: History },
    { id: 'settings' as TabType, label: 'Settings & Storage', icon: Settings },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16 p-2' : 'w-64 p-4'} bg-black border-r border-zinc-800/80 flex flex-col justify-between select-none flex-shrink-0 transition-all duration-300 relative`}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            {!isCollapsed && <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Main Menu</p>}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors mx-auto"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md shadow-zinc-100/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-emerald-400'} flex-shrink-0`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {item.id === 'downloader' && activeDownloadsCount > 0 && (
                    <span className={`${isCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px] flex items-center justify-center' : 'px-2 py-0.5 text-[10px]'} rounded-full bg-emerald-500 text-black font-bold animate-pulse`}>
                      {activeDownloadsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {!isCollapsed && (
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
        )}
      </div>

      <div className={`bg-zinc-900/60 ${isCollapsed ? 'p-2 justify-center' : 'p-3'} rounded-xl border border-zinc-800 flex items-center gap-2.5`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        {!isCollapsed && (
          <div className="truncate">
            <p className="text-[11px] font-semibold text-zinc-200">yt-dlp Engine Ready</p>
            <p className="text-[10px] text-zinc-500 truncate">v2026.07.04 Active</p>
          </div>
        )}
      </div>
    </aside>
  );
};
