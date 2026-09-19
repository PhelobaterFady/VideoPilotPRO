import React, { useState } from 'react';
import { X, Disc3, Film, ExternalLink, Folder, AlertCircle, HardDrive } from 'lucide-react';

export interface MediaPlayerModalProps {
  title: string;
  filePath: string;
  isVideo: boolean;
  onClose: () => void;
  thumbnail?: string;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  title,
  filePath,
  isVideo,
  onClose
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);

  // Stream directly from local PC file via embedded Express server (HTTP 206 Partial Content)
  const streamSrc = filePath
    ? `http://localhost:5000/api/stream?file=${encodeURIComponent(filePath)}`
    : '';

  const handleOpenExternal = async () => {
    if (!filePath) return;
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        await ipcRenderer.invoke('open-file', filePath);
        return;
      } catch (e) {
        console.warn('Failed to open with system player:', e);
      }
    }
  };

  const handleShowInFolder = async () => {
    if (!filePath) return;
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        await ipcRenderer.invoke('show-in-folder', filePath);
        return;
      } catch (e) {
        console.warn('Failed to show in folder:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3 truncate mr-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
              {isVideo ? <Film className="w-4 h-4" /> : <Disc3 className="w-4 h-4 animate-spin" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <HardDrive className="w-3 h-3" />
                <span>Playing from Local PC Storage</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {filePath && (
              <>
                <button
                  onClick={handleOpenExternal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-all"
                  title="Open in your default PC player (VLC / Windows Media Player)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PC Player</span>
                </button>
                <button
                  onClick={handleShowInFolder}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-all"
                  title="Show file location in Windows Explorer"
                >
                  <Folder className="w-3.5 h-3.5 text-sky-400" />
                  <span>Folder</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player Body */}
        <div className="relative bg-black flex items-center justify-center min-h-[380px] p-4">
          {!filePath ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <h4 className="text-sm font-bold text-white">No Local File Found</h4>
              <p className="text-xs text-zinc-400 max-w-sm">
                Please complete the download first so the file is saved to your computer before playing.
              </p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{loadError}</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  You can play the downloaded file directly with your default Windows media player.
                </p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Default Windows Media Player</span>
              </button>
            </div>
          ) : isVideo ? (
            <video
              src={streamSrc}
              controls
              autoPlay
              onError={() => setLoadError('Unable to render video format inside browser view.')}
              className="w-full max-h-[60vh] rounded-xl object-contain shadow-lg"
            >
              Your browser does not support local video playback.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 w-full">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
                <Disc3 className="w-12 h-12 text-black animate-spin" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-white max-w-md truncate px-4">{title}</h4>
                <p className="text-xs text-emerald-400 font-semibold mt-1">Local PC Audio Playback (MP3)</p>
              </div>
              <audio
                src={streamSrc}
                controls
                autoPlay
                onError={() => setLoadError('Unable to render audio format inside browser view.')}
                className="w-full max-w-md"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900/40 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 truncate max-w-lg">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span className="truncate font-mono text-[11px] text-zinc-400" title={filePath}>
              {filePath || 'No local path'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex-shrink-0"
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
};
