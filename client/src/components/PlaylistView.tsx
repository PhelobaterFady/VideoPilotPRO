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
    <div className="w-full my-4 glass-card rounded-3xl p-5 md:p-6 border border-zinc-800 shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700 flex-shrink-0">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white line-clamp-1">{playlist.title}</h2>
              <PlatformBadge platform={playlist.platform} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Channel / Playlist with <span className="font-bold text-emerald-400">{items.length}</span> items
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800 w-full md:w-auto">
          <div className="flex bg-zinc-950 p-1 rounded-xl">
            <button
              onClick={() => setDownloadMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                downloadMode === 'video' ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setDownloadMode('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                downloadMode === 'audio' ? 'bg-zinc-100 text-black font-bold' : 'text-zinc-400 hover:text-white'
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
              className="bg-zinc-950 text-emerald-400 font-bold text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="bestvideo+bestaudio/best">👑 Highest (4K / 1080p Max)</option>
              <option value="bestvideo[height<=1080]+bestaudio/best[height<=1080]/best">💎 Full HD 1080p</option>
              <option value="bestvideo[height<=720]+bestaudio/best[height<=720]/best">⚡ High Definition 720p</option>
              <option value="bestvideo[height<=480]+bestaudio/best[height<=480]/best">📦 Standard 480p</option>
            </select>
          )}

          <button
            onClick={handleStartBatchDownload}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Selected ({selectedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Smart Channel / Playlist Filter Toolbar */}
      <div className="bg-black/50 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Content Type Filter Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filter:</span>
            </span>
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'all' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setTypeFilter('shorts')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  typeFilter === 'shorts' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-rose-400'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Shorts ({shortsCount})</span>
              </button>
              <button
                onClick={() => setTypeFilter('long')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'long' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-emerald-400'
                }`}
              >
                Videos ({longCount})
              </button>
            </div>
          </div>

          {/* Duration Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sort:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-zinc-900 text-zinc-200 text-xs rounded-xl px-3 py-1.5 border border-zinc-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="default">Default Order</option>
              <option value="shortest">Shortest First ⏱️</option>
              <option value="longest">Longest First ⌛</option>
            </select>
          </div>
        </div>

        {/* Quick Selection Chips & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1"
            >
              {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>All ({filteredItems.length})</span>
            </button>
            <button
              onClick={() => selectTopN(5)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              Top 5
            </button>
            <button
              onClick={() => selectTopN(10)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              Top 10
            </button>
            <button
              onClick={() => selectTopN(25)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              Top 25
            </button>
            {selectedItems.length > 0 && (
              <button
                onClick={() => setSelectedItems([])}
                className="px-2 py-1 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search in tracks..."
              className="w-full bg-zinc-900 text-zinc-200 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-zinc-800 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        {filteredItems.map((item, idx) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <div
              key={item.id || idx}
              onClick={() => toggleSelectItem(item.id)}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 shadow-md'
                  : 'bg-zinc-950/60 hover:bg-zinc-900/60 border-zinc-800/60 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-emerald-400">
                  {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-zinc-600" />}
                </div>
                <span className="text-xs font-bold text-zinc-500 w-6 text-center">{idx + 1}</span>
                <img
                  src={item.thumbnail || playlist.thumbnail}
                  alt={item.title}
                  className="w-14 h-10 object-cover rounded-lg flex-shrink-0 bg-zinc-800"
                />
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate">{item.title}</h4>
                  <p className="text-[11px] text-zinc-500">{item.uploader}</p>
                </div>
              </div>

              {item.duration > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono flex-shrink-0 ml-2">
                  <Clock className="w-3 h-3 text-zinc-500" />
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
