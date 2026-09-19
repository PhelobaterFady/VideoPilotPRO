import React from 'react';
import type { DownloadQueueItem } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, CheckCircle2, AlertCircle, Loader2, Music, Video, Zap, Clock, Folder, Play, ExternalLink } from 'lucide-react';

interface ProgressQueueProps {
  queue: DownloadQueueItem[];
  onClearCompleted: () => void;
  onOpenFile?: (filePath: string) => void;
  onShowInFolder?: (filePath: string) => void;
  onPlayMedia?: (filePath: string, title: string, isVideo: boolean) => void;
}

export const ProgressQueue: React.FC<ProgressQueueProps> = ({
  queue,
  onClearCompleted,
  onOpenFile,
  onShowInFolder,
  onPlayMedia
}) => {
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
            <p className="text-xs text-zinc-400">Track real-time speed, percentage, and outputs ({queue.length})</p>
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
            className="bg-black/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3 shadow-lg transition-all"
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
                    {item.quality && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 font-mono border border-zinc-800">
                        {item.quality}
                      </span>
                    )}
                    {(item.filePath || item.outputDir) && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 font-mono truncate max-w-xs">
                        <Folder className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">{item.filePath || item.outputDir}</span>
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
                  <div className="flex items-center gap-2">
                    {onPlayMedia && (item.filePath || item.downloadUrl) && (
                      <button
                        onClick={() => onPlayMedia(item.filePath || item.downloadUrl || '', item.title, !item.isAudio)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                        title="Play in App"
                      >
                        <Play className="w-3.5 h-3.5 fill-emerald-400" />
                      </button>
                    )}
                    {onOpenFile && item.filePath && (
                      <button
                        onClick={() => onOpenFile(item.filePath!)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1"
                        title="Open with system player"
                      >
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                        <span>Open</span>
                      </button>
                    )}
                    {onShowInFolder && (item.filePath || item.outputDir) && (
                      <button
                        onClick={() => onShowInFolder(item.filePath || item.outputDir!)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1"
                        title="Show in Windows Explorer"
                      >
                        <Folder className="w-3 h-3 text-emerald-400" />
                        <span>Folder</span>
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>
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
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden relative border border-zinc-800">
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
