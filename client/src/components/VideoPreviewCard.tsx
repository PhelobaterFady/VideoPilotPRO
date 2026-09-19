import React, { useState } from 'react';
import type { MediaInfo } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, Clock, User, ExternalLink, Check, FileText, Zap } from 'lucide-react';

interface VideoPreviewCardProps {
  media: MediaInfo;
  onDownload: (url: string, formatId: string, isAudio: boolean, title: string, subtitleLang?: string) => void;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  media,
  onDownload
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>(
    media.formats && media.formats.length > 0 ? media.formats[0].formatId : 'best'
  );
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [copied, setCopied] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const selectedFormatObj = media.formats?.find(f => f.formatId === selectedFormat);
  const isAudio = selectedFormatObj ? !selectedFormatObj.isVideo : selectedFormat.includes('audio');

  const handleDownloadClick = () => {
    onDownload(
      media.webpage_url || media.id,
      selectedFormat,
      isAudio,
      media.title,
      selectedSubtitle !== 'none' ? selectedSubtitle : undefined
    );
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
        {/* Thumbnail Preview with In-App Play Overlay */}
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

        {/* Video Details & Format Picker */}
        <div className="flex-1 w-full flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg md:text-xl font-bold text-white line-clamp-2 leading-snug">
                {media.title}
              </h2>
            </div>
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                <Zap className="w-3 h-3" /> Turbo 5x
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
            {/* Format & Quality Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400">
                  Select Resolution / Format:
                </label>
                {selectedFormatObj?.filesizeFormatted && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Est. {selectedFormatObj.filesizeFormatted}
                  </span>
                )}
              </div>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <optgroup label="🎵 Studio Audio">
                  {media.formats?.filter(f => !f.isVideo).map((fmt) => (
                    <option key={fmt.formatId} value={fmt.formatId}>
                      🎵 {fmt.label} {fmt.filesizeFormatted ? `(~${fmt.filesizeFormatted})` : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎬 Video Resolutions">
                  {media.formats?.filter(f => f.isVideo).map((fmt) => (
                    <option key={fmt.formatId} value={fmt.formatId}>
                      🎬 {fmt.label} {fmt.filesizeFormatted ? `(~${fmt.filesizeFormatted})` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Subtitles Option & Link Copy */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-400 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Include Subtitles:</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="none">No Subtitles</option>
                  {media.subtitles && media.subtitles.length > 0 ? (
                    media.subtitles.map(sub => (
                      <option key={sub.code} value={sub.code}>
                        {sub.name}
                      </option>
                    ))
                  ) : (
                    <option value="en">English (Auto)</option>
                  )}
                </select>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex-shrink-0"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>
              {isAudio ? 'Download Audio MP3 (320kbps)' : `Download Video (${selectedFormatObj?.quality || 'Best'})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
