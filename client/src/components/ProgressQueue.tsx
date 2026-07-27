import React from 'react';
import type { DownloadQueueItem } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, CheckCircle2, AlertCircle, Loader2, Music, Video, Zap, Clock, Folder } from 'lucide-react';

interface ProgressQueueProps {
  queue: DownloadQueueItem[];
  onClearCompleted: () => void;
}

export const ProgressQueue: React.FC<ProgressQueueProps> = ({ queue, onClearCompleted }) => {
  if (queue.length === 0) return null;

  const hasCompleted = queue.some(i => i.status === 'completed');

  return (
    <div className="w-full max-w-4xl mx-auto my-6 glass-card rounded-3xl p-6 border border-zinc-800 shadow-2xl relative">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Download className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Download Progress & Status</h3>
            <p className="text-xs text-zinc-400">Track real-time speed, percentage, and file outputs ({queue.length})</p>
          </div>
        </div>

        {hasCompleted && (
          <button
            onClick={onClearCompleted}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Clear Completed
          </button>
        )}
      </div>

      <div className="space-y-4 mt-5">
        {queue.map((item) => (
          <div
            key={item.id}
            className="bg-black/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-12 h-10 rounded-xl object-cover flex-shrink-0 bg-zinc-900 border border-zinc-800"
                  />
                ) : item.isAudio ? (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                )}

                <div className="truncate">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <PlatformBadge platform={item.platform} showText={false} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono border border-zinc-800">
                      {item.isAudio ? 'Audio MP3' : 'Video MP4'}
                    </span>
                    {item.outputDir && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 font-mono truncate max-w-xs">
                        <Folder className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">{item.outputDir}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                {item.status === 'downloading' && (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{Math.round(item.progress)}%</span>
                    </span>
                    {(item.speed || item.eta) && (
                      <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-zinc-400 mt-1">
                        {item.speed && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Zap className="w-3 h-3" />
                            {item.speed}
                          </span>
                        )}
                        {item.eta && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-3 h-3" />
                            ETA {item.eta}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved to PC</span>
                  </span>
                )}

                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Real-time Progress Bar */}
            {item.status === 'downloading' && (
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden relative border border-zinc-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${Math.max(item.progress, 5)}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
