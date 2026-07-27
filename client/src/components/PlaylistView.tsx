import React, { useState } from 'react';
import type { MediaInfo, PlaylistItem } from '../types';
import { ListVideo, Download, CheckSquare, Square, Search, Music, Video, Clock } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface PlaylistViewProps {
  playlist: MediaInfo;
  onBatchDownload: (items: PlaylistItem[], isAudio: boolean, qualityFormat: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, onBatchDownload }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(
    playlist.items ? playlist.items.map(i => i.id) : []
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [downloadMode, setDownloadMode] = useState<'video' | 'audio'>('video');
  const [qualityFormat] = useState('bestvideo[height<=720]+bestaudio/best[height<=720]');

  const items = playlist.items || [];
  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
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
    <div className="w-full max-w-4xl mx-auto my-4 glass-card rounded-3xl p-5 md:p-6 border border-zinc-800 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
            <ListVideo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{playlist.title}</h2>
              <PlatformBadge platform={playlist.platform} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Playlist containing <span className="font-bold text-emerald-400">{playlist.itemCount || items.length}</span> items
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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 my-4">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          {selectedItems.length === filteredItems.length && filteredItems.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          ) : (
            <Square className="w-4 h-4 text-zinc-600" />
          )}
          <span>Select All ({filteredItems.length})</span>
        </button>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter playlist tracks..."
            className="w-full bg-zinc-950 text-zinc-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-zinc-800 focus:outline-none focus:border-emerald-500"
          />
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
