import React from 'react';
import { X, Disc3, Film } from 'lucide-react';

export interface MediaPlayerModalProps {
  title: string;
  mediaUrl: string;
  isVideo: boolean;
  onClose: () => void;
  thumbnail?: string;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  title,
  mediaUrl,
  isVideo,
  onClose
}) => {
  // Convert local Windows file paths into a safe file:// URI
  const formattedSrc = mediaUrl.startsWith('http')
    ? mediaUrl
    : `file:///${mediaUrl.replace(/\\/g, '/')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3 truncate mr-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              {isVideo ? <Film className="w-4 h-4" /> : <Disc3 className="w-4 h-4 animate-spin" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-zinc-400">VideoPilot Pro Built-in Media Player</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Player Body */}
        <div className="relative bg-black flex items-center justify-center min-h-[360px] p-4">
          {isVideo ? (
            <video
              src={formattedSrc}
              controls
              autoPlay
              className="w-full max-h-[60vh] rounded-xl object-contain shadow-lg"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 w-full">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
                <Disc3 className="w-12 h-12 text-black animate-spin" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-white max-w-md truncate px-4">{title}</h4>
                <p className="text-xs text-emerald-400 font-semibold mt-1">High Fidelity Audio Playback</p>
              </div>
              <audio src={formattedSrc} controls autoPlay className="w-full max-w-md" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900/40 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate max-w-xs font-mono text-[10px] text-zinc-500">{mediaUrl}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
};
