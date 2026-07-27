import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { History, Trash2, Download, ExternalLink, Calendar, Search } from 'lucide-react';
import { PlatformBadge } from './PlatformBadge';

interface HistoryViewProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Downloads History</h2>
            <p className="text-xs text-zinc-400">Total downloads recorded: {history.length}</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {history.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search download history..."
            className="w-full bg-zinc-900 text-zinc-100 text-xs rounded-xl pl-10 pr-3 py-2.5 border border-zinc-800 focus:outline-none focus:border-emerald-500"
          />
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
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-14 h-12 rounded-xl object-cover flex-shrink-0 bg-zinc-800"
                  />
                ) : (
                  <div className="w-14 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate">
                  <h4 className="text-xs font-bold text-zinc-200 truncate">{item.title}</h4>
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

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all flex-shrink-0"
                title="Open Source Link"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
