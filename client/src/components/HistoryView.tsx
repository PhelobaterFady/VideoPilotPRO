import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { History, Trash2, Download, ExternalLink, Calendar, Search, Folder } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface HistoryViewProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onOpenFile?: (filePath: string) => void;
  onShowInFolder?: (filePath: string) => void;
  onDeleteItem?: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onOpenFile,
  onShowInFolder,
  onDeleteItem
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Downloads History</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {history.length} items
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Recorded: <span className="text-zinc-200 font-semibold">{videoCount}</span> videos, <span className="text-zinc-200 font-semibold">{audioCount}</span> audio files
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-zinc-900/40 p-2.5 rounded-2xl border border-zinc-800/80">
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
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-zinc-900 text-zinc-100 text-xs rounded-xl pl-8 pr-3 py-2 border border-zinc-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* History Grid */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 text-zinc-400 space-y-2">
          <Download className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No download history found</p>
          <p className="text-xs text-zinc-500">Downloaded videos and audio tracks will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredHistory.map((item) => (
            <div
                key={item.id}
                className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition duration-200"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-14 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Download className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-zinc-200 truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge platform={item.platform} showText={false} />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {item.format}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {new Date(item.downloadDate).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.filePath && onOpenFile && (
                    <button
                      onClick={() => onOpenFile(item.filePath!)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
                      title="Open File"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-300" />
                    </button>
                  )}

                  {item.filePath && onShowInFolder && (
                    <button
                      onClick={() => onShowInFolder(item.filePath!)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
                      title="Show in Folder"
                    >
                      <Folder className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                  )}

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {onDeleteItem && (
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                      title="Remove from history"
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
