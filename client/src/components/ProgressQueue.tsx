import React from 'react';
import type { DownloadQueueItem } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { CheckCircle2, AlertCircle, Loader2, Music, Video, Clock, Folder, ExternalLink, Pause, Play, X, Smartphone, Activity, Minimize2 } from 'lucide-react';

interface ProgressQueueProps {
  queue: DownloadQueueItem[];
  onClearCompleted: () => void;
  onOpenFile?: (filePath: string) => void;
  onShowInFolder?: (filePath: string) => void;
  onPauseDownload?: (id: string) => void;
  onResumeDownload?: (id: string) => void;
  onCancelDownload?: (id: string) => void;
  onSendToPhone?: (filePath: string, title: string) => void;
  onCompressVideo?: (filePath: string, fileName: string) => void;
}

export const ProgressQueue: React.FC<ProgressQueueProps> = ({
  queue,
  onClearCompleted,
  onOpenFile,
  onShowInFolder,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onSendToPhone,
  onCompressVideo
}) => {
  if (queue.length === 0) return null;

  const hasCompleted = queue.some(i => i.status === 'completed');

  return (
    <div className="w-full my-6 cockpit-card rounded-3xl p-5 md:p-6 border border-white/[0.08] relative">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20 shadow-md shadow-cyan-500/10">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white tracking-tight">Active Mission Queue</h3>
            <p className="text-xs text-[#8290A5]">Real-time bandwidth, transfer telemetry, and output files ({queue.length})</p>
          </div>
        </div>

        {hasCompleted && (
          <button
            onClick={onClearCompleted}
            className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition-colors"
          >
            Clear Completed
          </button>
        )}
      </div>

      <div className="space-y-3.5 mt-5">
        {queue.map((item) => (
          <div
            key={item.id}
            className="bg-[#0A0D15]/90 p-4 rounded-2xl border border-white/[0.07] flex flex-col gap-3 shadow-lg transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-14 h-11 rounded-xl object-cover flex-shrink-0 bg-[#07090E] border border-white/[0.08]"
                  />
                ) : item.isAudio ? (
                  <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#00E5FF] flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                )}

                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate font-display">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <PlatformBadge platform={item.platform} showText={false} />
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0E131F] text-zinc-300 font-mono border border-white/[0.06]">
                      {item.isAudio ? 'Audio MP3' : 'Video MP4'}
                    </span>
                    {item.quality && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] font-mono border border-[#00E5FF]/20 font-bold">
                        {item.quality}
                      </span>
                    )}
                    {(item.filePath || item.outputDir) && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#8290A5] font-mono truncate max-w-xs">
                        <Folder className="w-3 h-3 text-[#00E5FF]" />
                        <span className="truncate">{item.filePath || item.outputDir}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Actions Right Column */}
              <div className="flex-shrink-0 text-right">
                {item.status === 'downloading' && (
                  <div className="flex items-center gap-2.5">
                    <div className="space-y-1 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{Math.round(item.progress)}%</span>
                      </span>
                      {(item.speed || item.eta) && (
                        <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[#8290A5] mt-1">
                          {item.speed && (
                            <span className="flex items-center gap-1.5 text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-md border border-[#00E5FF]/20">
                              <span className="flex items-center gap-0.5 text-[#00E5FF]">
                                <span className="speed-wave-bar" style={{ animationDelay: '0ms' }} />
                                <span className="speed-wave-bar" style={{ animationDelay: '200ms' }} />
                                <span className="speed-wave-bar" style={{ animationDelay: '400ms' }} />
                              </span>
                              <span>{item.speed}</span>
                            </span>
                          )}
                          {item.eta && (
                            <span className="flex items-center gap-1 text-[#8290A5]">
                              <Clock className="w-3 h-3" />
                              ETA {item.eta}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {onPauseDownload && (
                        <button
                          onClick={() => onPauseDownload(item.id)}
                          className="p-2 rounded-xl bg-white/[0.05] hover:bg-[#FFB020]/20 text-zinc-300 hover:text-[#FFB020] border border-white/[0.08] transition-all"
                          title="Pause Transfer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onCancelDownload && (
                        <button
                          onClick={() => onCancelDownload(item.id)}
                          className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/[0.08] transition-all"
                          title="Abort Transfer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {item.status === 'paused' && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30">
                      <Pause className="w-3 h-3" />
                      <span>Paused ({Math.round(item.progress)}%)</span>
                    </span>
                    {onResumeDownload && (
                      <button
                        onClick={() => onResumeDownload(item.id)}
                        className="p-2 rounded-xl bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 transition-all"
                        title="Resume Transfer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    {onCancelDownload && (
                      <button
                        onClick={() => onCancelDownload(item.id)}
                        className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/[0.08] transition-all"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {item.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/[0.05] text-[#8290A5] border border-white/[0.08]">
                    <X className="w-3 h-3" />
                    <span>Aborted</span>
                  </span>
                )}

                {item.status === 'completed' && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {onSendToPhone && item.filePath && (
                      <button
                        onClick={() => onSendToPhone(item.filePath!, item.title)}
                        className="px-2.5 py-1 rounded-lg bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-mono font-semibold border border-[#00E5FF]/30 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Transfer to Phone via Wi-Fi QR"
                      >
                        <Smartphone className="w-3 h-3 text-[#00E5FF]" />
                        <span>Phone</span>
                      </button>
                    )}
                    {onCompressVideo && item.filePath && !item.isAudio && (
                      <button
                        onClick={() => onCompressVideo(item.filePath!, item.title)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Compress video for WhatsApp / Discord / Email"
                      >
                        <Minimize2 className="w-3 h-3" />
                        <span>Compress</span>
                      </button>
                    )}
                    {onOpenFile && item.filePath && (
                      <button
                        onClick={() => onOpenFile(item.filePath!)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-all flex items-center gap-1"
                        title="Play media in system player"
                      >
                        <ExternalLink className="w-3 h-3 text-[#8290A5]" />
                        <span>Open</span>
                      </button>
                    )}
                    {onShowInFolder && (item.filePath || item.outputDir) && (
                      <button
                        onClick={() => onShowInFolder(item.filePath || item.outputDir!)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-all flex items-center gap-1"
                        title="Show in Windows Explorer"
                      >
                        <Folder className="w-3 h-3 text-[#00E5FF]" />
                        <span>Folder</span>
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Saved</span>
                    </span>
                  </div>
                )}

                {item.status === 'error' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Real-time Progress Bar */}
            {(item.status === 'downloading' || item.status === 'paused') && (
              <div className="w-full bg-[#07090E] h-2 rounded-full overflow-hidden relative border border-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-300 shadow-sm ${
                    item.status === 'paused'
                      ? 'bg-[#FFB020]'
                      : 'bg-gradient-to-r from-[#00E5FF] to-[#00E676]'
                  }`}
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
