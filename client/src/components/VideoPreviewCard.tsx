import React, { useState } from 'react';
import type { MediaInfo } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, Clock, User, ExternalLink, Check } from 'lucide-react';

interface VideoPreviewCardProps {
  media: MediaInfo;
  onDownload: (url: string, formatId: string, isAudio: boolean, title: string) => void;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({ media, onDownload }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>(
    media.formats && media.formats.length > 0 ? media.formats[0].formatId : 'best'
  );
  const [copied, setCopied] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownloadClick = () => {
    const formatObj = media.formats?.find(f => f.formatId === selectedFormat);
    const isAudio = formatObj ? !formatObj.isVideo : selectedFormat.includes('audio');
    onDownload(media.webpage_url || media.id, selectedFormat, isAudio, media.title);
  };

  const handleCopy = () => {
    if (media.webpage_url) {
      navigator.clipboard.writeText(media.webpage_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 glass-card rounded-3xl p-5 border border-zinc-800 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-5 items-center">
        <div className="relative w-full md:w-80 h-48 md:h-52 rounded-2xl overflow-hidden group shadow-lg flex-shrink-0 bg-zinc-900">
          <img
            src={media.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80'}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute top-3 left-3">
            <PlatformBadge platform={media.platform} />
          </div>
          {media.duration ? (
            <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-200 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDuration(media.duration)}</span>
            </div>
          ) : null}
        </div>

        <div className="flex-1 w-full flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 leading-snug">
              {media.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                {media.uploader}
              </span>
              {media.type === 'short' && (
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                  Reel / Short
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Select Format & Quality:
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <optgroup label="🎵 Audio Only">
                  <option value="audio-best">🎵 Audio MP3 High Quality (320kbps)</option>
                </optgroup>
                <optgroup label="🎬 Video with Audio">
                  {media.formats && media.formats.filter(f => f.isVideo).map((fmt) => (
                    <option key={fmt.formatId} value={fmt.formatId}>
                      🎬 {fmt.label} ({fmt.quality})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ExternalLink className="w-4 h-4 text-zinc-400" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Download Media Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
