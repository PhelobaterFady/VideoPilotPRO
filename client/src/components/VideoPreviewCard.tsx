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
  const initialFormat = media.formats?.find(f => f.isVideo)?.formatId || (media.formats && media.formats[0] ? media.formats[0].formatId : 'best');
  const [selectedFormat, setSelectedFormat] = useState<string>(initialFormat);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const bestFmt = media.formats?.find(f => f.isVideo)?.formatId || (media.formats && media.formats[0] ? media.formats[0].formatId : 'best');
    setSelectedFormat(bestFmt);
  }, [media.id, media.webpage_url]);

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
    <div className="w-full my-4 glass-card rounded-3xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Thumbnail Preview with In-App Play Overlay */}
        <div className="relative w-full md:w-96 h-52 md:h-64 rounded-2xl overflow-hidden group shadow-lg flex-shrink-0 bg-zinc-900">
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

          {/* Visual Interactive Quality Selector */}
          <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Select Format & Quality</span>
                {selectedFormatObj?.filesizeFormatted && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Est. {selectedFormatObj.filesizeFormatted}
                  </span>
                )}
              </div>

              {/* Subtitles & Link Tools */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <select
                    value={selectedSubtitle}
                    onChange={(e) => setSelectedSubtitle(e.target.value)}
                    className="bg-transparent text-zinc-300 text-[11px] focus:outline-none cursor-pointer"
                  >
                    <option value="none">No Subs</option>
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
                </div>

                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-1 text-[11px]"
                  title="Copy video link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />}
                </button>
              </div>
            </div>

            {/* Quality Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {media.formats && media.formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.formatId;
                const isFmtAudio = !fmt.isVideo;
                return (
                  <button
                    key={fmt.formatId}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.formatId)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative interactive-card flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isFmtAudio
                          ? 'bg-purple-500/20 text-purple-300'
                          : fmt.quality.includes('2160') || fmt.quality.includes('4K')
                          ? 'bg-amber-500/20 text-amber-300'
                          : fmt.quality.includes('1080')
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {isFmtAudio ? 'AUDIO' : fmt.quality || fmt.ext.toUpperCase()}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white truncate">{fmt.label.split('(')[0]}</p>
                    <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {fmt.filesizeFormatted || 'Auto Quality'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>
              {isAudio ? 'Download Audio MP3 (320kbps)' : `Download Video (${selectedFormatObj?.quality || 'Best Quality'})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
