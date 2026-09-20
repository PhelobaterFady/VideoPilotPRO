import React, { useState, useMemo } from 'react';
import type { MediaInfo, PlaylistItem } from '../types';
import { ListVideo, Download, CheckSquare, Square, Search, Music, Video, Clock, Filter, ArrowUpDown, Flame } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface PlaylistViewProps {
  playlist: MediaInfo;
  onBatchDownload: (items: PlaylistItem[], isAudio: boolean, qualityFormat: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onBatchDownload }) => {
  const items = playlist.items || [];
  const [selectedItems, setSelectedItems] = useState<string[]>(
    items.map(i => i.id)
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [downloadMode, setDownloadMode] = useState<'video' | 'audio'>('video');
  const [qualityFormat, setQualityFormat] = useState('bestvideo+bestaudio/best');
  const [typeFilter, setTypeFilter] = useState<'all' | 'shorts' | 'long'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'shortest' | 'longest'>('default');

  const shortsCount = useMemo(() => {
    return items.filter(i => i.isShort || (i.duration > 0 && i.duration <= 60)).length;
  }, [items]);

  const longCount = useMemo(() => {
    return items.filter(i => !i.isShort && (i.duration === 0 || i.duration > 60)).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            item.uploader.toLowerCase().includes(searchFilter.toLowerCase());
      if (!matchesSearch) return false;

      const isShortItem = item.isShort || (item.duration > 0 && item.duration <= 60);
      if (typeFilter === 'shorts') return isShortItem;
      if (typeFilter === 'long') return !isShortItem;
      return true;
    });

    if (sortOrder === 'shortest') {
      list = [...list].sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sortOrder === 'longest') {
      list = [...list].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return list;
  }, [items, searchFilter, typeFilter, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const selectTopN = (n: number) => {
    const topIds = filteredItems.slice(0, n).map(i => i.id);
    setSelectedItems(topIds);
  };

  const toggleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleStartBatchDownload = () => {
    const itemsToDownload = items.filter(i => selectedItems.includes(i.id));
    if (itemsToDownload.length === 0) return;
    onBatchDownload(itemsToDownload, downloadMode === 'audio', downloadMode === 'audio' ? 'audio-best' : qualityFormat);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full my-4 cockpit-card rounded-2xl p-5 md:p-6 border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-5">
      {/* Cockpit Channel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[rgba(0,229,255,0.08)] text-[#00e5ff] flex items-center justify-center border border-[rgba(0,229,255,0.25)] flex-shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-display tracking-tight line-clamp-1">{playlist.title}</h2>
              <PlatformBadge platform={playlist.platform} />
            </div>
            <p className="text-xs text-[rgba(240,244,248,0.5)] mt-1 flex items-center gap-2">
              <span>Channel / Batch Roster</span>
              <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]" />
              <span className="font-mono text-[#00e5ff] font-semibold">{items.length} items detected</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-[rgba(14,19,31,0.85)] p-2 rounded-xl border border-[rgba(255,255,255,0.08)] w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex bg-[rgba(7,9,14,0.8)] p-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
            <button
              onClick={() => setDownloadMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                downloadMode === 'video'
                  ? 'bg-[#00e5ff] text-[#07090e] font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-[rgba(240,244,248,0.6)] hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setDownloadMode('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                downloadMode === 'audio'
                  ? 'bg-[#00e5ff] text-[#07090e] font-bold shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                  : 'text-[rgba(240,244,248,0.6)] hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio MP3</span>
            </button>
          </div>

          {/* Quality Selector for Video */}
          {downloadMode === 'video' && (
            <select
              value={qualityFormat}
              onChange={(e) => setQualityFormat(e.target.value)}
              className="bg-[rgba(7,9,14,0.8)] text-[#00e5ff] font-mono font-medium text-xs px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] focus:outline-none focus:border-[#00e5ff] cursor-pointer"
            >
              <option value="bestvideo+bestaudio/best">Master: 4K / 1080p UHD</option>
              <option value="bestvideo[height<=1080]+bestaudio/best[height<=1080]/best">Studio: Full HD 1080p</option>
              <option value="bestvideo[height<=720]+bestaudio/best[height<=720]/best">Stream: HD 720p</option>
              <option value="bestvideo[height<=480]+bestaudio/best[height<=480]/best">Compact: SD 480p</option>
            </select>
          )}

          <button
            onClick={handleStartBatchDownload}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] text-[#07090e] shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] disabled:opacity-40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download ({selectedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Smart Channel / Playlist Filter Bay */}
      <div className="bg-[rgba(10,14,23,0.8)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Content Type Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[rgba(240,244,248,0.5)] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>Filter:</span>
            </span>
            <div className="flex items-center bg-[rgba(7,9,14,0.6)] p-0.5 rounded-lg border border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  typeFilter === 'all' ? 'bg-[#00e5ff] text-[#07090e] font-bold' : 'text-[rgba(240,244,248,0.6)] hover:text-white'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setTypeFilter('shorts')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  typeFilter === 'shorts' ? 'bg-[#ff5252] text-white font-bold' : 'text-[rgba(240,244,248,0.6)] hover:text-[#ff5252]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Shorts ({shortsCount})</span>
              </button>
              <button
                onClick={() => setTypeFilter('long')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  typeFilter === 'long' ? 'bg-[#00e676] text-[#07090e] font-bold' : 'text-[rgba(240,244,248,0.6)] hover:text-[#00e676]'
                }`}
              >
                Videos ({longCount})
              </button>
            </div>
          </div>

          {/* Duration Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[rgba(240,244,248,0.5)] flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[rgba(240,244,248,0.5)]" />
              <span>Sort:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[rgba(7,9,14,0.8)] text-zinc-300 text-xs rounded-lg px-3 py-1.5 border border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[#00e5ff]"
            >
              <option value="default">Roster Order</option>
              <option value="shortest">Shortest First ⏱️</option>
              <option value="longest">Longest First ⌛</option>
            </select>
          </div>
        </div>

        {/* Quick Selection Chips & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)] text-zinc-200 border border-[rgba(255,255,255,0.08)] transition-colors flex items-center gap-1.5"
            >
              {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#00e5ff]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>All ({filteredItems.length})</span>
            </button>
            <button
              onClick={() => selectTopN(5)}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-zinc-300 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.06)] transition-colors"
            >
              Top 5
            </button>
            <button
              onClick={() => selectTopN(10)}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-zinc-300 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.06)] transition-colors"
            >
              Top 10
            </button>
            <button
              onClick={() => selectTopN(25)}
              className="px-2.5 py-1 rounded-md text-xs font-mono text-zinc-300 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.06)] transition-colors"
            >
              Top 25
            </button>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setSelectedItems([])}
                className="px-2 py-1 rounded-md text-xs text-[rgba(240,244,248,0.4)] hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[rgba(240,244,248,0.4)]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search playlist tracks..."
              className="w-full bg-[rgba(7,9,14,0.8)] text-zinc-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-[rgba(255,255,255,0.08)] focus:outline-none focus:border-[#00e5ff]"
            />
          </div>
        </div>
      </div>

      {/* Roster Items List */}
      <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-aerospace-scrollbar">
        {filteredItems.map((item, idx) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <div
              key={item.id || idx}
              onClick={() => toggleSelectItem(item.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-[rgba(0,229,255,0.06)] border-[rgba(0,229,255,0.3)] text-white shadow-[0_0_12px_rgba(0,229,255,0.08)]'
                  : 'bg-[rgba(14,19,31,0.5)] hover:bg-[rgba(14,19,31,0.8)] border-[rgba(255,255,255,0.05)] text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-[#00e5ff]">
                  {isSelected ? <CheckSquare className="w-4 h-4 text-[#00e5ff]" /> : <Square className="w-4 h-4 text-zinc-600" />}
                </div>
                <span className="text-xs font-mono text-[rgba(240,244,248,0.35)] w-6 text-center">{idx + 1}</span>
                <img
                  src={item.thumbnail || playlist.thumbnail}
                  alt={item.title}
                  className="w-14 h-10 object-cover rounded-md flex-shrink-0 bg-zinc-900 border border-[rgba(255,255,255,0.08)]"
                />
                <div className="truncate">
                  <h4 className="text-xs font-medium text-zinc-200 truncate">{item.title}</h4>
                  <p className="text-[11px] text-[rgba(240,244,248,0.45)] truncate">{item.uploader}</p>
                </div>
              </div>

              {item.duration > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-[rgba(240,244,248,0.5)] font-mono flex-shrink-0 ml-3 bg-[rgba(0,0,0,0.3)] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.04)]">
                  <Clock className="w-3 h-3 text-[#ffb020]" />
                  <span>{formatDuration(item.duration)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
