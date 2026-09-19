import React, { useState } from 'react';
import { X, Disc3, Film, ExternalLink, AlertCircle } from 'lucide-react';

export interface MediaPlayerModalProps {
  title: string;
  mediaUrl: string;
  isVideo: boolean;
  onClose: () => void;
  thumbnail?: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0` : null;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  title,
  mediaUrl,
  isVideo,
  onClose
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);

  // If local file, stream via local Express server endpoint (supports Range 206, scrubbing & seeking)
  const isLocalFile = !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://');
  const streamSrc = isLocalFile
    ? `http://localhost:5000/api/stream?file=${encodeURIComponent(mediaUrl)}`
    : mediaUrl;

  const handleOpenExternal = async () => {
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        if (isLocalFile) {
          await ipcRenderer.invoke('open-file', mediaUrl);
        } else {
          await ipcRenderer.invoke('open-external', mediaUrl);
        }
        return;
      } catch (e) {
        console.warn('Failed to open externally:', e);
      }
    }
    if (!isLocalFile) {
      window.open(mediaUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3 truncate mr-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
              {isVideo ? <Film className="w-4 h-4" /> : <Disc3 className="w-4 h-4 animate-spin" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-zinc-400">Video Pilot Pro Built-in Player</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLocalFile && (
              <button
                onClick={handleOpenExternal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-all"
                title="Open in default system player (VLC, Windows Media Player, etc.)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in App</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player Body */}
        <div className="relative bg-black flex items-center justify-center min-h-[380px] p-4">
          {youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              title={title}
              className="w-full h-[420px] rounded-xl border border-zinc-800 shadow-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{loadError}</h4>
                <p className="text-xs text-zinc-400 mt-1">You can open the file with your default Windows media player below.</p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in System Media Player</span>
              </button>
            </div>
          ) : isVideo ? (
            <video
              src={streamSrc}
              controls
              autoPlay
              onError={() => setLoadError('Could not render video directly in browser engine.')}
              className="w-full max-h-[60vh] rounded-xl object-contain shadow-lg"
            >
              Your system does not support native video playback.
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
              <audio
                src={streamSrc}
                controls
                autoPlay
                onError={() => setLoadError('Could not render audio directly in browser engine.')}
                className="w-full max-w-md"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900/40 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate max-w-sm font-mono text-[10px] text-zinc-500" title={mediaUrl}>
            {mediaUrl}
          </span>
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
