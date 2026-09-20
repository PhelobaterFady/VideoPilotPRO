import React, { useState } from 'react';
import type { MediaInfo } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, Clock, User, ExternalLink, Check, FileText, Zap, Scissors, Image as ImageIcon } from 'lucide-react';

interface VideoPreviewCardProps {
  media: MediaInfo;
  onDownload: (url: string, formatId: string, isAudio: boolean, title: string, subtitleLang?: string, clipStart?: string, clipEnd?: string) => void;
  onOpenTranscript?: (media: MediaInfo) => void;
  onSavePoster?: (thumbnailUrl: string, title: string) => void;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  media,
  onDownload,
  onOpenTranscript,
  onSavePoster
}) => {
  const initialFormat = media.formats?.find(f => f.isVideo)?.formatId || (media.formats && media.formats[0] ? media.formats[0].formatId : 'best');
  const [selectedFormat, setSelectedFormat] = useState<string>(initialFormat);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [copied, setCopied] = useState(false);

  // Video Trimmer State
  const [isTrimmerActive, setIsTrimmerActive] = useState<boolean>(false);
  const [clipStart, setClipStart] = useState<string>('00:00:00');
  const [clipEnd, setClipEnd] = useState<string>('00:01:00');

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
      selectedSubtitle !== 'none' ? selectedSubtitle : undefined,
      isTrimmerActive ? clipStart : undefined,
      isTrimmerActive ? clipEnd : undefined
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
    <div className="w-full my-4 cockpit-card rounded-3xl p-5 md:p-6 border border-white/[0.08] relative overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Thumbnail Inspector Bay */}
        <div className="relative w-full lg:w-96 h-56 md:h-64 rounded-2xl overflow-hidden group flex-shrink-0 bg-[#07090E] border border-white/[0.08] shadow-2xl">
          <img
            src={media.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80'}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          <div className="absolute top-3 left-3 z-10">
            <PlatformBadge platform={media.platform} />
          </div>

          {/* HD Poster Extraction Button */}
          {media.thumbnail && onSavePoster && (
            <button
              onClick={() => onSavePoster(media.thumbnail, media.title)}
              className="absolute top-3 right-3 bg-[#07090E]/90 hover:bg-[#00E5FF] hover:text-black text-white px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border border-white/[0.1] shadow-lg z-10"
              title="Save Ultra HD Poster"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>HD Poster</span>
            </button>
          )}

          {media.duration ? (
            <div className="absolute bottom-3 right-3 bg-[#07090E]/90 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-200 flex items-center gap-1.5 border border-white/[0.08]">
              <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{formatDuration(media.duration)}</span>
            </div>
          ) : null}
        </div>

        {/* Right: Technical Inspector & Format Cartridges */}
        <div className="flex-1 w-full flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-display font-bold text-white line-clamp-2 leading-snug">
              {media.title}
            </h2>

            {/* Meta telemetry row */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-[#8290A5]">
              <span className="flex items-center gap-1.5 font-medium text-zinc-200">
                <User className="w-3.5 h-3.5 text-[#00E5FF]" />
                {media.uploader}
              </span>
              {media.type === 'short' && (
                <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 text-[10px] font-mono font-bold border border-pink-500/30">
                  Reel / Short
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E676]/10 text-[#00E676] text-[10px] font-mono font-bold border border-[#00E676]/20">
                <Zap className="w-3 h-3" /> Multi-Stream Telemetry
              </span>

              {/* Subtitles Extractor Button */}
              {onOpenTranscript && (
                <button
                  onClick={() => onOpenTranscript(media)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-all hover:border-[#00E5FF]"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Transcript</span>
                </button>
              )}

              {/* Trimmer Toggle Button */}
              <button
                onClick={() => setIsTrimmerActive(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isTrimmerActive
                    ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/50 shadow-md shadow-amber-500/10'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border-white/[0.08]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-[#FFB020]" />
                <span>{isTrimmerActive ? 'Trimmer Active ✂️' : 'Clip Section'}</span>
              </button>

              {/* Copy URL */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition-all ml-auto"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <ExternalLink className="w-3.5 h-3.5 text-[#8290A5]" />}
              </button>
            </div>
          </div>

          {/* Interactive Format Cartridges Deck */}
          <div className="bg-[#0A0D15]/80 p-3.5 rounded-2xl border border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-white tracking-wide uppercase">
                  Select Format & Quality
                </span>
                {selectedFormatObj?.filesizeFormatted && (
                  <span className="text-[10px] font-mono text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
                    Est. {selectedFormatObj.filesizeFormatted}
                  </span>
                )}
              </div>

              {/* Subtitle Selector */}
              <div className="flex items-center gap-1.5 bg-[#07090E] px-2.5 py-1 rounded-xl border border-white/[0.08]">
                <FileText className="w-3 h-3 text-[#00E5FF]" />
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="bg-transparent text-zinc-300 text-[11px] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="none" className="bg-[#0E131F]">No Subs</option>
                  {media.subtitles && media.subtitles.length > 0 ? (
                    media.subtitles.map(sub => (
                      <option key={sub.code} value={sub.code} className="bg-[#0E131F]">
                        {sub.name}
                      </option>
                    ))
                  ) : (
                    <option value="en" className="bg-[#0E131F]">English (Auto)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Format Cartridges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {media.formats && media.formats.map((fmt) => {
                const isSelected = selectedFormat === fmt.formatId;
                const isFmtAudio = !fmt.isVideo;
                return (
                  <button
                    key={fmt.formatId}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.formatId)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'flight-cartridge-active'
                        : 'flight-cartridge'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        isFmtAudio
                          ? 'bg-purple-500/20 text-purple-300'
                          : fmt.quality.includes('2160') || fmt.quality.includes('4K')
                          ? 'bg-amber-500/20 text-amber-300 font-black'
                          : fmt.quality.includes('1080')
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'bg-white/[0.06] text-zinc-300'
                      }`}>
                        {isFmtAudio ? 'AUDIO' : fmt.quality || fmt.ext.toUpperCase()}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#00E5FF] text-black flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white truncate font-display">{fmt.label.split('(')[0]}</p>
                    <span className="text-[10px] font-mono text-[#8290A5] mt-0.5">
                      {fmt.filesizeFormatted || 'Auto Max'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Section Trimmer Panel */}
          {isTrimmerActive && (
            <div className="bg-[#FFB020]/10 p-3.5 rounded-2xl border border-[#FFB020]/30 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#FFB020]" />
                  <span className="text-xs font-display font-bold text-amber-200">Precision Clip Trimmer</span>
                </div>
                <span className="text-[10px] text-amber-300/80 font-mono">Downloads selected timecode range only</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                  <span className="text-xs text-[#8290A5] font-mono">From:</span>
                  <input
                    type="text"
                    value={clipStart}
                    onChange={(e) => setClipStart(e.target.value)}
                    placeholder="00:00:00"
                    className="w-full bg-[#07090E] border border-white/[0.1] focus:border-[#FFB020] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                  <span className="text-xs text-[#8290A5] font-mono">To:</span>
                  <input
                    type="text"
                    value={clipEnd}
                    onChange={(e) => setClipEnd(e.target.value)}
                    placeholder="00:01:00"
                    className="w-full bg-[#07090E] border border-white/[0.1] focus:border-[#FFB020] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setClipStart('00:00:00'); setClipEnd('00:00:30'); }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] text-zinc-200 font-mono"
                  >
                    First 30s
                  </button>
                  <button
                    type="button"
                    onClick={() => { setClipStart('00:00:00'); setClipEnd('00:01:00'); }}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] text-zinc-200 font-mono"
                  >
                    First 60s
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-display font-bold text-sm bg-[#00E5FF] hover:bg-[#33ebff] text-black shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99] select-none"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isTrimmerActive
                ? `Download Trimmed Clip (${clipStart} -> ${clipEnd})`
                : (isAudio ? 'Engage Audio Download (MP3 320kbps)' : `Engage Download (${selectedFormatObj?.quality || 'Best Quality'})`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
