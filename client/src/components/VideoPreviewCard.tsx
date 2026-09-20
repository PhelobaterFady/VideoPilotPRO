import React, { useState } from 'react';
import type { MediaInfo } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { Download, Clock, User, ExternalLink, Check, FileText, Zap, Scissors, Image as ImageIcon, Volume2, FastForward, Camera } from 'lucide-react';

interface VideoPreviewCardProps {
  media: MediaInfo;
  onDownload: (options: {
    url: string;
    format: string;
    isAudio: boolean;
    title: string;
    subtitleLang?: string;
    clipStart?: string;
    clipEnd?: string;
    audioBoost?: string;
    playbackSpeed?: number;
  }) => void;
  onOpenTranscript?: (media: MediaInfo) => void;
  onSavePoster?: (thumbnailUrl: string, title: string) => void;
  onSnapFrame?: (timestamp: string, title: string) => void;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({
  media,
  onDownload,
  onOpenTranscript,
  onSavePoster,
  onSnapFrame
}) => {
  const initialFormat = media.formats?.find(f => f.isVideo)?.formatId || (media.formats && media.formats[0] ? media.formats[0].formatId : 'best');
  const [selectedFormat, setSelectedFormat] = useState<string>(initialFormat);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('none');
  const [copied, setCopied] = useState(false);

  // Video Trimmer State
  const [isTrimmerActive, setIsTrimmerActive] = useState<boolean>(false);
  const [clipStart, setClipStart] = useState<string>('00:00:00');
  const [clipEnd, setClipEnd] = useState<string>('00:01:00');

  // Studio Audio & Speed FX State
  const [isFxActive, setIsFxActive] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioBoost, setAudioBoost] = useState<string>('none');

  // Frame Grabber Input
  const [isGrabbingFrame, setIsGrabbingFrame] = useState<boolean>(false);
  const [frameTimestamp, setFrameTimestamp] = useState<string>('00:00:05');

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
    onDownload({
      url: media.webpage_url || media.id,
      format: selectedFormat,
      isAudio,
      title: media.title,
      subtitleLang: selectedSubtitle !== 'none' ? selectedSubtitle : undefined,
      clipStart: isTrimmerActive ? clipStart : undefined,
      clipEnd: isTrimmerActive ? clipEnd : undefined,
      audioBoost: isFxActive ? audioBoost : 'none',
      playbackSpeed: isFxActive ? playbackSpeed : 1.0
    });
  };

  const handleCopy = () => {
    if (media.webpage_url) {
      navigator.clipboard.writeText(media.webpage_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerSnap = () => {
    if (onSnapFrame) {
      onSnapFrame(frameTimestamp || '00:00:05', media.title);
      setIsGrabbingFrame(false);
    }
  };

  return (
    <div className="w-full my-4 cockpit-card rounded-2xl p-5 md:p-6 border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[rgba(0,229,255,0.03)] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row gap-6 items-start relative z-10">
        {/* Left Column: Media Poster & Telemetry Badges */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="relative group rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-lg aspect-video bg-[#07090e]">
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e]/90 via-transparent to-transparent opacity-80" />

            {/* Duration Tag */}
            {media.duration !== undefined && media.duration > 0 && (
              <div className="absolute bottom-2.5 right-2.5 bg-[#07090e]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-[#ffb020] font-bold border border-[rgba(255,176,32,0.3)] shadow-md flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#ffb020]" />
                <span>{formatDuration(media.duration)}</span>
              </div>
            )}

            {/* Platform Beacon */}
            <div className="absolute top-2.5 left-2.5">
              <PlatformBadge platform={media.platform} />
            </div>
          </div>

          {/* Quick Media Extraction Tools Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onSavePoster && media.thumbnail && (
              <button
                onClick={() => onSavePoster(media.thumbnail, media.title)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#00e5ff] border border-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
                title="Save Full HD Poster to Disk"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Save Poster</span>
              </button>
            )}

            {onSnapFrame && (
              <button
                onClick={() => setIsGrabbingFrame(prev => !prev)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                  isGrabbingFrame
                    ? 'bg-[rgba(0,229,255,0.15)] text-[#00e5ff] border-[#00e5ff]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300 border-[rgba(255,255,255,0.06)]'
                }`}
                title="Snap Lossless Photographic PNG Frame"
              >
                <Camera className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Snap Frame</span>
              </button>
            )}
          </div>

          {/* Lossless Frame Grabber Bar */}
          {isGrabbingFrame && (
            <div className="p-3 rounded-xl bg-[rgba(10,14,23,0.9)] border border-[rgba(0,229,255,0.3)] space-y-2 animate-in fade-in duration-200">
              <span className="text-[11px] font-mono text-[rgba(240,244,248,0.7)] block">
                Timecode (HH:MM:SS):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={frameTimestamp}
                  onChange={(e) => setFrameTimestamp(e.target.value)}
                  placeholder="00:00:05"
                  className="w-full bg-[#07090e] border border-[rgba(255,255,255,0.1)] focus:border-[#00e5ff] rounded-lg px-2.5 py-1 text-xs text-[#00e5ff] font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTriggerSnap}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-[#00e5ff] hover:bg-[#33ebff] text-black transition-all cursor-pointer flex-shrink-0 font-display"
                >
                  Capture
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Title, Format Matrix, Audio FX, Trimmer & Download Action */}
        <div className="flex-1 w-full space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg md:text-xl font-bold font-display text-white line-clamp-2 leading-snug">
              {media.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[rgba(240,244,248,0.5)]">
              {media.uploader && (
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span className="text-zinc-300">{media.uploader}</span>
                </div>
              )}

              {onOpenTranscript && (
                <button
                  onClick={() => onOpenTranscript(media)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300 border border-[rgba(255,255,255,0.06)] transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>Transcript</span>
                </button>
              )}

              {/* Speed & Audio FX Toggle Button */}
              <button
                onClick={() => setIsFxActive(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isFxActive
                    ? 'bg-[rgba(0,229,255,0.15)] text-[#00e5ff] border-[rgba(0,229,255,0.4)] shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                    : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300 border-[rgba(255,255,255,0.06)]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Speed & Audio FX {isFxActive && '⚡'}</span>
              </button>

              {/* Trimmer Toggle Button */}
              <button
                onClick={() => setIsTrimmerActive(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isTrimmerActive
                    ? 'bg-[rgba(255,176,32,0.15)] text-[#ffb020] border-[rgba(255,176,32,0.4)] shadow-[0_0_12px_rgba(255,176,32,0.15)]'
                    : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300 border-[rgba(255,255,255,0.06)]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-[#ffb020]" />
                <span>{isTrimmerActive ? 'Trimmer Active ✂️' : 'Clip Section'}</span>
              </button>

              {/* Copy URL */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300 border border-[rgba(255,255,255,0.06)] transition-all ml-auto cursor-pointer"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00e676]" /> : <ExternalLink className="w-3.5 h-3.5 text-[#8290A5]" />}
              </button>
            </div>
          </div>

          {/* Interactive Format Cartridges Deck */}
          <div className="bg-[rgba(10,14,23,0.8)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-white tracking-wide uppercase">
                  Select Format & Quality
                </span>
                {selectedFormatObj?.filesizeFormatted && (
                  <span className="text-[10px] font-mono text-[#00e5ff] font-bold bg-[rgba(0,229,255,0.1)] px-2 py-0.5 rounded-full border border-[rgba(0,229,255,0.2)]">
                    Est. {selectedFormatObj.filesizeFormatted}
                  </span>
                )}
              </div>

              {/* Subtitle Selector */}
              <div className="flex items-center gap-1.5 bg-[#07090e] px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
                <FileText className="w-3 h-3 text-[#00e5ff]" />
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="bg-transparent text-zinc-300 text-[11px] font-medium focus:outline-none cursor-pointer font-mono"
                >
                  <option value="none" className="bg-[#0e131f]">No Subs</option>
                  {media.subtitles && media.subtitles.length > 0 ? (
                    media.subtitles.map(sub => (
                      <option key={sub.code} value={sub.code} className="bg-[#0e131f]">
                        {sub.name}
                      </option>
                    ))
                  ) : (
                    <option value="en" className="bg-[#0e131f]">English</option>
                  )}
                </select>
              </div>
            </div>

            {/* Cartridges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {media.formats?.map((fmt) => {
                const isSelected = selectedFormat === fmt.formatId;
                const isFmtAudio = !fmt.isVideo;

                return (
                  <button
                    key={fmt.formatId}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.formatId)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
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
                        <div className="w-4 h-4 rounded-full bg-[#00e5ff] text-black flex items-center justify-center shadow-sm">
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

          {/* Speed & Audio FX Studio Panel */}
          {isFxActive && (
            <div className="bg-[rgba(0,229,255,0.06)] p-3.5 rounded-xl border border-[rgba(0,229,255,0.25)] space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FastForward className="w-4 h-4 text-[#00e5ff]" />
                  <span className="text-xs font-display font-bold text-white">Lecture Pre-Speed & Audio FX</span>
                </div>
                <span className="text-[10px] text-[#00e5ff] font-mono">Bakes custom tempo & pitch correction</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Playback Speed Options */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-[rgba(240,244,248,0.7)]">Speed Rate:</span>
                  <div className="grid grid-cols-5 gap-1 font-mono">
                    {[1.0, 1.25, 1.5, 1.75, 2.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackSpeed(rate)}
                        className={`py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          playbackSpeed === rate
                            ? 'bg-[#00e5ff] text-[#07090e] border-[#00e5ff]'
                            : 'bg-[#07090e] text-zinc-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Booster & Denoise */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-[rgba(240,244,248,0.7)] flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#00e5ff]" />
                    <span>Audio Enhancement:</span>
                  </span>
                  <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                    {[
                      { id: 'none', label: 'Normal' },
                      { id: '+6dB', label: '+6dB Boost' },
                      { id: '+12dB', label: '+12dB Boost' },
                      { id: 'denoise', label: 'Noise Filter' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAudioBoost(opt.id)}
                        className={`py-1 px-1 rounded-md font-semibold border text-center transition-all cursor-pointer truncate ${
                          audioBoost === opt.id
                            ? 'bg-[#00e676] text-[#07090e] border-[#00e676] font-bold'
                            : 'bg-[#07090e] text-zinc-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Section Trimmer Panel */}
          {isTrimmerActive && (
            <div className="bg-[rgba(255,176,32,0.08)] p-3.5 rounded-xl border border-[rgba(255,176,32,0.3)] space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#ffb020]" />
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
                    className="w-full bg-[#07090e] border border-white/[0.1] focus:border-[#ffb020] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[130px]">
                  <span className="text-xs text-[#8290A5] font-mono">To:</span>
                  <input
                    type="text"
                    value={clipEnd}
                    onChange={(e) => setClipEnd(e.target.value)}
                    placeholder="00:01:00"
                    className="w-full bg-[#07090e] border border-white/[0.1] focus:border-[#ffb020] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setClipStart('00:00:00'); setClipEnd('00:00:30'); }}
                    className="px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-[11px] text-zinc-200 font-mono cursor-pointer"
                  >
                    First 30s
                  </button>
                  <button
                    type="button"
                    onClick={() => { setClipStart('00:00:00'); setClipEnd('00:01:00'); }}
                    className="px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-[11px] text-zinc-200 font-mono cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] hover:from-[#33ebff] hover:to-[#29b6f6] text-[#07090e] shadow-[0_0_25px_rgba(0,229,255,0.25)] transition-all transform active:scale-[0.99] select-none cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isTrimmerActive
                ? `Download Trimmed Clip (${clipStart} -> ${clipEnd})`
                : (isAudio ? 'Engage Audio Download (MP3 320kbps)' : `Engage Download (${selectedFormatObj?.quality || 'Best Quality'})`)}
              {isFxActive && playbackSpeed !== 1.0 && ` [${playbackSpeed}x Speed]`}
              {isFxActive && audioBoost !== 'none' && ` [${audioBoost}]`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
