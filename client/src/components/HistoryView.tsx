import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { History, Trash2, Download, ExternalLink, Calendar, Search, Folder, Smartphone, Database, Film, Music, Minimize2 } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface HistoryViewProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onOpenFile?: (filePath: string) => void;
  onShowInFolder?: (filePath: string) => void;
  onDeleteItem?: (id: string) => void;
  onSendToPhone?: (filePath: string, title: string) => void;
  onCompressVideo?: (filePath: string, fileName: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onOpenFile,
  onShowInFolder,
  onDeleteItem,
  onSendToPhone,
  onCompressVideo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'video' | 'audio' | 'youtube' | 'tiktok'>('all');

  const videoCount = history.filter(i => i.type === 'video').length;
  const audioCount = history.filter(i => i.type === 'audio').length;

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'video') return item.type === 'video';
    if (categoryFilter === 'audio') return item.type === 'audio';
    if (categoryFilter === 'youtube') return item.platform === 'youtube';
    if (categoryFilter === 'tiktok') return item.platform === 'tiktok';
    return true;
  });

  return (
    <div className="w-full space-y-5 tab-content-enter">
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cockpit-card p-5 rounded-3xl border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20 shadow-md shadow-cyan-500/10">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-bold text-white tracking-tight">Vault Archive</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-mono font-bold">
                {history.length} logged
              </span>
            </div>
            <p className="text-xs text-[#8290A5]">
              Local storage: <span className="text-white font-semibold">{videoCount}</span> videos, <span className="text-white font-semibold">{audioCount}</span> audio tracks
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Archive</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0A0D15]/80 p-3 rounded-2xl border border-white/[0.07]">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: `All (${history.length})` },
              { id: 'video', label: `🎬 Videos (${videoCount})` },
              { id: 'audio', label: `🎵 Audio (${audioCount})` },
              { id: 'youtube', label: 'YouTube' },
              { id: 'tiktok', label: 'TikTok' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === f.id
                    ? 'bg-[#00E5FF] text-black font-bold shadow-md shadow-cyan-500/20 font-display'
                    : 'bg-[#0E131F] text-[#8290A5] hover:text-white hover:bg-white/[0.06] border border-white/[0.05]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8290A5]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search archive..."
              className="w-full bg-[#07090E] text-white text-xs rounded-xl pl-8 pr-3 py-2 border border-white/[0.08] focus:outline-none focus:border-[#00E5FF] font-medium placeholder-[#607085]"
            />
          </div>
        </div>
      )}

      {/* History Grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 cockpit-card rounded-3xl border border-white/[0.06] text-[#8290A5] space-y-3">
          <History className="w-9 h-9 mx-auto text-[#607085] mb-2" />
          <p className="text-sm font-display font-semibold text-zinc-200">No media records found</p>
          <p className="text-xs text-[#8290A5]">Completed downloads and extracts will be archived here for 1-click access.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="cockpit-card-interactive p-4 rounded-2xl border border-white/[0.07] flex items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-14 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#07090E] border border-white/[0.08] flex items-center justify-center">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'audio' ? (
                    <Music className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Film className="w-5 h-5 text-[#00E5FF]" />
                  )}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate font-display" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <PlatformBadge platform={item.platform} showText={false} />
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E131F] text-zinc-300 font-mono border border-white/[0.06]">
                      {item.format}
                    </span>
                    <span className="text-[10px] text-[#8290A5] flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#607085]" />
                      {new Date(item.downloadDate).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.filePath && onSendToPhone && (
                  <button
                    onClick={() => onSendToPhone(item.filePath!, item.title)}
                    className="p-2 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/30 transition-all cursor-pointer"
                    title="Send to Phone via Wi-Fi QR"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.filePath && item.type === 'video' && onCompressVideo && (
                  <button
                    onClick={() => onCompressVideo(item.filePath!, item.title)}
                    className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer"
                    title="Compress for WhatsApp / Discord / Email"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.filePath && onOpenFile && (
                  <button
                    onClick={() => onOpenFile(item.filePath!)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition-all"
                    title="Open File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.filePath && onShowInFolder && (
                  <button
                    onClick={() => onShowInFolder(item.filePath!)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#00E5FF] border border-white/[0.08] transition-all"
                    title="Show in Folder"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                )}

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8290A5] hover:text-white border border-white/[0.08] transition-all"
                  title="Source link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {onDeleteItem && (
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-[#8290A5] hover:text-red-400 border border-white/[0.08] transition-all"
                    title="Remove from archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
