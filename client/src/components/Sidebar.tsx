import React from 'react';
import { Download, Layers, History, Settings, Radio, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

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
    { id: 'downloader' as TabType, label: 'Mission Deck', sublabel: 'Direct Downloader', icon: Download },
    { id: 'batch' as TabType, label: 'Batch Queue', sublabel: 'Multi-Link Processing', icon: Layers },
    { id: 'history' as TabType, label: 'Vault Archive', sublabel: 'Downloaded Media', icon: History },
    { id: 'settings' as TabType, label: 'Flight Config', sublabel: 'Storage & Limiter', icon: Settings },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[70px] p-2.5' : 'w-64 p-4'
      } bg-[#0A0D15]/95 border-r border-white/[0.08] flex flex-col justify-between select-none flex-shrink-0 transition-all duration-300 relative z-30 backdrop-blur-xl`}
    >
      <div className="space-y-6">
        {/* Navigation Header */}
        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8290A5]">
                // NAVIGATION
              </span>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors mx-auto"
                title={isCollapsed ? 'Expand Deck' : 'Collapse Deck'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#00E5FF]" /> : <ChevronLeft className="w-4 h-4 text-zinc-400" />}
              </button>
            )}
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-white/[0.12] to-white/[0.04] text-white border border-[#00E5FF]/40 shadow-lg shadow-cyan-500/10'
                      : 'text-[#8290A5] hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/30'
                          : 'bg-white/[0.05] text-[#8290A5] group-hover:text-white group-hover:bg-white/[0.08]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isCollapsed && (
                      <div className="text-left">
                        <p className={`font-display text-[13px] font-bold ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-[#8290A5] font-normal leading-tight">
                          {item.sublabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {item.id === 'downloader' && activeDownloadsCount > 0 && (
                    <span
                      className={`${
                        isCollapsed
                          ? 'absolute -top-1 -right-1 w-4 h-4 text-[9px] flex items-center justify-center'
                          : 'px-2 py-0.5 text-[10px]'
                      } rounded-full bg-[#00E5FF] text-black font-mono font-bold animate-pulse shadow-sm shadow-cyan-500/40`}
                    >
                      {activeDownloadsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Platforms Radar Deck */}
        {!isCollapsed && (
          <div className="cockpit-card rounded-2xl p-3 border border-white/[0.07]">
            <p className="text-[10px] font-mono font-bold text-[#8290A5] mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Supported Feeds</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2 bg-[#07090E]/90 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> YouTube
              </div>
              <div className="flex items-center gap-2 bg-[#07090E]/90 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> TikTok
              </div>
              <div className="flex items-center gap-2 bg-[#07090E]/90 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> Instagram
              </div>
              <div className="flex items-center gap-2 bg-[#07090E]/90 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Facebook
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Engine Status Bottom Tile */}
      <div
        className={`cockpit-card ${
          isCollapsed ? 'p-2 justify-center' : 'p-3'
        } rounded-xl border border-white/[0.08] flex items-center gap-2.5`}
      >
        <div className="w-7 h-7 rounded-lg bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-4 h-4 text-[#00E676]" />
        </div>
        {!isCollapsed && (
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
              <p className="text-[11px] font-bold text-white font-display">Engine Calibrated</p>
            </div>
            <p className="text-[10px] font-mono text-[#8290A5] truncate">yt-dlp v2026.8.19 Ready</p>
          </div>
        )}
      </div>
    </aside>
  );
};
