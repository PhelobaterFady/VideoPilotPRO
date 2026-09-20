import { useState } from 'react';
import { Smartphone, Film, RefreshCw, CheckCircle2, AlertCircle, Folder, Play, QrCode, UploadCloud, Sliders, ArrowRight, Music, Video } from 'lucide-react';
import type { HistoryItem } from '../types';

interface ConvertersViewProps {
  apiBaseUrl: string;
  appSecret: string;
  downloadPath: string;
  historyItems: HistoryItem[];
  onOpenFile?: (path: string) => void;
  onShowInFolder?: (path: string) => void;
  onSendToPhone?: (filePath: string, title: string) => void;
  onPlayVideo?: (filePath: string, title: string) => void;
}

export type CanvasAspect = '9:16' | '1:1' | '4:5';
export type CanvasStyle = 'blur' | 'crop' | 'fit';
export type ConvertMode = 'canvas_916' | 'format_transcode';

export const ConvertersView: React.FC<ConvertersViewProps> = ({
  apiBaseUrl,
  appSecret,
  downloadPath,
  historyItems,
  onOpenFile,
  onShowInFolder,
  onSendToPhone,
  onPlayVideo
}) => {
  const [activeMode, setActiveMode] = useState<ConvertMode>('canvas_916');
  
  // Selected source media
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  // 9:16 Canvas Options
  const [aspectRatio, setAspectRatio] = useState<CanvasAspect>('9:16');
  const [canvasStyle, setCanvasStyle] = useState<CanvasStyle>('blur');
  const [blurRadius, setBlurRadius] = useState<number>(25);
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');

  // Format Transcode Options
  const [targetFormat, setTargetFormat] = useState<string>('mp4');
  const [audioBitrate, setAudioBitrate] = useState<string>('320k');

  // Conversion Execution State
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<{
    filePath: string;
    fileName: string;
    originalSize: string;
    outputSize: string;
    details: string;
  } | null>(null);

  // File Picker using Electron or Prompt fallback
  const handlePickFile = async () => {
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const picked = await ipcRenderer.invoke('select-video-file');
        if (picked) {
          setSelectedFilePath(picked);
          setSelectedFileName(picked.split(/[\\/]/).pop() || 'Video');
          setConversionResult(null);
          setErrorMsg(null);
          return;
        }
      } catch (e) {
        console.warn('IPC select-video-file error:', e);
      }
    }
    const custom = prompt('Enter full path to video file on your PC (e.g. C:/Videos/sample.mp4):', selectedFilePath);
    if (custom && custom.trim()) {
      setSelectedFilePath(custom.trim());
      setSelectedFileName(custom.trim().split(/[\\/]/).pop() || 'Video');
      setConversionResult(null);
      setErrorMsg(null);
    }
  };

  // Select directly from recent completed history
  const handleSelectFromHistory = (item: HistoryItem) => {
    if (item.filePath) {
      setSelectedFilePath(item.filePath);
      setSelectedFileName(item.title);
      setConversionResult(null);
      setErrorMsg(null);
    }
  };

  // Execute 9:16 Canvas Reformatting
  const handleStartReformat = async () => {
    if (!selectedFilePath) {
      setErrorMsg('Please select a video file first to convert');
      return;
    }
    setIsConverting(true);
    setErrorMsg(null);
    setConversionResult(null);
    setProgressMsg('Applying cinematic background scaling & dual-layer blur overlay...');

    try {
      const res = await fetch(`${apiBaseUrl}/api/tools/reformat-canvas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': appSecret
        },
        body: JSON.stringify({
          inputPath: selectedFilePath,
          outputDir: downloadPath || undefined,
          aspect: aspectRatio,
          style: canvasStyle,
          blurRadius,
          resolution
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Canvas reformatting failed');
      }

      setConversionResult({
        filePath: json.filePath,
        fileName: json.fileName,
        originalSize: json.originalSize || 'Original',
        outputSize: json.outputSize || 'Exported',
        details: `Reformatted to ${json.aspect} (${canvasStyle === 'blur' ? 'Cinematic Smart Blur' : canvasStyle.toUpperCase()})`
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during reformatting');
    } finally {
      setIsConverting(false);
      setProgressMsg('');
    }
  };

  // Execute Format Transcoding
  const handleStartTranscode = async () => {
    if (!selectedFilePath) {
      setErrorMsg('Please select a media file first to convert');
      return;
    }
    setIsConverting(true);
    setErrorMsg(null);
    setConversionResult(null);
    setProgressMsg(`Transcoding stream to .${targetFormat.toUpperCase()} container...`);

    try {
      const res = await fetch(`${apiBaseUrl}/api/tools/convert-format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': appSecret
        },
        body: JSON.stringify({
          inputPath: selectedFilePath,
          outputDir: downloadPath || undefined,
          targetFormat,
          audioBitrate
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Format conversion failed');
      }

      setConversionResult({
        filePath: json.filePath,
        fileName: json.fileName,
        originalSize: json.originalSize || 'Original',
        outputSize: json.outputSize || 'Exported',
        details: `Converted to .${json.targetFormat.toUpperCase()} Container`
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during format conversion');
    } finally {
      setIsConverting(false);
      setProgressMsg('');
    }
  };

  const completedVideoItems = historyItems.filter(i => i.filePath && !i.format?.toLowerCase().includes('mp3') && i.format !== 'audio-best').slice(0, 6);

  return (
    <div className="w-full space-y-6 tab-content-enter pb-10">
      {/* Studio Header Card */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/25 shadow-lg shadow-cyan-500/10">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-white tracking-tight">Converter Studio</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] text-[10px] font-mono font-bold border border-[#00E5FF]/30">
                PRO REELS & FORMATS
              </span>
            </div>
            <p className="text-xs text-[#8290A5]">
              Reformat videos to 9:16 Shorts/TikTok with smart blurred canvas, or convert across all media containers
            </p>
          </div>
        </div>

        {/* Studio Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#07090E] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => { setActiveMode('canvas_916'); setConversionResult(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'canvas_916'
                ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/30'
                : 'text-[#8290A5] hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>9:16 Reels Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('format_transcode'); setConversionResult(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'format_transcode'
                ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/30'
                : 'text-[#8290A5] hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Format Transcoder</span>
          </button>
        </div>
      </div>

      {/* Media Ingestion & Source Selector Card */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="text-sm font-bold font-display text-white">Select Target Video File:</h3>
          </div>

          <button
            type="button"
            onClick={handlePickFile}
            className="px-4 py-2 rounded-xl text-xs font-display font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-[#00E5FF]" />
            <span>Browse Video from PC...</span>
          </button>
        </div>

        {/* Selected File Box */}
        <div className="p-3.5 rounded-2xl bg-[#07090E] border border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#00E5FF] flex-shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate font-display">
                {selectedFileName || 'No video selected yet'}
              </div>
              <div className="text-[11px] font-mono text-[#8290A5] truncate">
                {selectedFilePath || 'Click "Browse Video from PC" or pick from your recent downloads below'}
              </div>
            </div>
          </div>

          {selectedFilePath && (
            <span className="px-2.5 py-1 rounded-full bg-[#00E676]/15 text-[#00E676] font-mono text-[10px] font-bold border border-[#00E676]/30 flex-shrink-0">
              Ready for Conversion
            </span>
          )}
        </div>

        {/* Quick Pick from Recent History */}
        {completedVideoItems.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono text-[#8290A5] flex items-center gap-1.5">
              <span>⚡ Quick Pick from Vault Downloads:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-aerospace-scrollbar">
              {completedVideoItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFromHistory(item)}
                  className={`px-3 py-1.5 rounded-xl border text-left transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                    selectedFilePath === item.filePath
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF]/50 text-[#00E5FF]'
                      : 'bg-[#07090E] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate max-w-[140px] font-display">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODE 1: 9:16 Shorts & Reels Studio */}
      {activeMode === 'canvas_916' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">Shorts & Reels Canvas Settings</h3>
                <p className="text-xs text-[#8290A5]">Configure canvas aspect ratio, background blur styling, and export resolution</p>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold font-display text-zinc-300">1. Target Aspect Ratio:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '9:16' as CanvasAspect, label: '📱 9:16 Vertical', sub: 'TikTok, Reels, Shorts', res: '1080 × 1920' },
                  { id: '1:1' as CanvasAspect, label: '⏹️ 1:1 Square', sub: 'Instagram Feed & Square', res: '1080 × 1080' },
                  { id: '4:5' as CanvasAspect, label: '🖼️ 4:5 Portrait', sub: 'Instagram Vertical Feed', res: '1080 × 1350' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAspectRatio(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      aspectRatio === opt.id ? 'flight-cartridge-active' : 'flight-cartridge'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-display text-white">{opt.label}</div>
                      <div className="text-[11px] font-mono text-[#00E5FF] mt-0.5">{opt.sub}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#8290A5] border-t border-white/5 pt-1.5">{opt.res}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Style Selector */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold font-display text-zinc-300">2. Background Style Effect:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'blur' as CanvasStyle, label: '✨ Cinematic Smart Blur', sub: 'Blurred background fill', desc: 'Preserves 100% of video with glowing background' },
                  { id: 'crop' as CanvasStyle, label: '🔍 Center Crop & Fill', sub: 'Full screen frame', desc: 'Fills entire 9:16 canvas by cropping horizontal sides' },
                  { id: 'fit' as CanvasStyle, label: '⬛ Black Letterbox', sub: 'Clean black padding', desc: 'Maintains aspect ratio with crisp black bars' }
                ].map((styleOpt) => (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => setCanvasStyle(styleOpt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      canvasStyle === styleOpt.id ? 'flight-cartridge-active' : 'flight-cartridge'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-display text-white">{styleOpt.label}</div>
                      <div className="text-[11px] font-mono text-[#00E5FF] mt-0.5">{styleOpt.sub}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#8290A5] border-t border-white/5 pt-1.5">{styleOpt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Blur Intensity Slider (Visible when blur is chosen) */}
            {canvasStyle === 'blur' && (
              <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-zinc-300">Background Blur Intensity:</span>
                  <span className="text-xs font-mono font-bold text-[#00E5FF]">{blurRadius} px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={blurRadius}
                  onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                  className="w-full accent-[#00E5FF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8290A5]">
                  <span>Light (10px)</span>
                  <span>Cinematic Medium (25px)</span>
                  <span>Deep Dreamy Glow (50px)</span>
                </div>
              </div>
            )}

            {/* Resolution Selector */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07090E] border border-white/[0.08] flex-wrap gap-3">
              <div>
                <div className="text-xs font-bold font-display text-white">Target Output Resolution:</div>
                <div className="text-[11px] font-mono text-[#8290A5]">High-efficiency H.264 rendering with uncompressed AAC audio</div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { id: '1080p', label: '1080p Ultra HD (Crisp)' },
                  { id: '720p', label: '720p Mobile Fast' }
                ].map((resOpt) => (
                  <button
                    key={resOpt.id}
                    type="button"
                    onClick={() => setResolution(resOpt.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      resolution === resOpt.id
                        ? 'bg-[#00E5FF] text-black shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {resOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Convert Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartReformat}
                disabled={isConverting || !selectedFilePath}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] via-[#33ebff] to-[#00b0ff] text-black font-display font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{progressMsg || 'Rendering 9:16 Canvas...'}</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    <span>Convert & Export to 9:16 Shorts / Reels</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Universal Format Transcoder */}
      {activeMode === 'format_transcode' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">Universal Transcoder & Container Converter</h3>
                <p className="text-xs text-[#8290A5]">Convert videos and audios to any standard media container without watermarks</p>
              </div>
            </div>

            {/* Target Format Pills */}
            <div className="space-y-2">
              <span className="text-xs font-bold font-display text-zinc-300">Select Output Container / Format:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {[
                  { id: 'mp4', name: 'MP4 Video', sub: 'Universal' },
                  { id: 'mp3', name: 'MP3 Audio', sub: '320kbps' },
                  { id: 'wav', name: 'WAV Studio', sub: 'Lossless' },
                  { id: 'mkv', name: 'MKV Video', sub: 'Multi-track' },
                  { id: 'mov', name: 'MOV Apple', sub: 'QuickTime' },
                  { id: 'webm', name: 'WebM VP9', sub: 'Web Ready' },
                  { id: 'm4a', name: 'M4A Audio', sub: 'Apple AAC' },
                  { id: 'flac', name: 'FLAC Hi-Res', sub: 'Audiophile' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      targetFormat === fmt.id
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF]/60 text-[#00E5FF] font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-[#07090E] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-display">{fmt.name}</span>
                    <span className="text-[10px] font-mono text-[#8290A5]">{fmt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Bitrate (if audio format) */}
            {['mp3', 'm4a', 'aac'].includes(targetFormat) && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07090E] border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-bold font-display text-white">Audio Output Bitrate:</span>
                </div>
                <div className="flex items-center gap-2">
                  {['128k', '192k', '256k', '320k'].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setAudioBitrate(rate)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        audioBitrate === rate
                          ? 'bg-[#00E5FF] text-black'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {rate.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartTranscode}
                disabled={isConverting || !selectedFilePath}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] via-[#33ebff] to-[#00b0ff] text-black font-display font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{progressMsg || 'Transcoding format...'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Convert to .{targetFormat.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#FFB020]/10 border border-[#FFB020]/40 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#FFB020] flex-shrink-0" />
          <span className="font-mono">{errorMsg}</span>
        </div>
      )}

      {/* Success Showcase Card */}
      {conversionResult && (
        <div className="cockpit-card p-6 rounded-3xl border border-[#00E676]/40 bg-[#00E676]/5 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00E676]/20 text-[#00E676] flex items-center justify-center border border-[#00E676]/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-[#00E676] font-bold uppercase tracking-wider">Conversion Completed Successfully! 🎉</div>
                <h4 className="text-base font-bold font-display text-white">{conversionResult.fileName}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-[#07090E] px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-[#8290A5]">Before: {conversionResult.originalSize}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="text-[#00E676] font-bold">Output: {conversionResult.outputSize}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-[#8290A5] bg-[#07090E] p-3 rounded-xl border border-white/5">
            {conversionResult.details} • Saved in vault directory
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {onOpenFile && (
              <button
                type="button"
                onClick={() => onOpenFile(conversionResult.filePath)}
                className="px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#33ebff] text-black font-display font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Open File</span>
              </button>
            )}

            {onPlayVideo && (
              <button
                type="button"
                onClick={() => onPlayVideo(conversionResult.filePath, conversionResult.fileName)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-[#00E5FF]" />
                <span>Play in Player</span>
              </button>
            )}

            {onShowInFolder && (
              <button
                type="button"
                onClick={() => onShowInFolder(conversionResult.filePath)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center gap-2"
              >
                <Folder className="w-4 h-4 text-[#00E5FF]" />
                <span>Show in Folder</span>
              </button>
            )}

            {onSendToPhone && (
              <button
                type="button"
                onClick={() => onSendToPhone(conversionResult.filePath, conversionResult.fileName)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-bold text-xs border border-white/15 transition-all cursor-pointer flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-[#00E676]" />
                <span>Send to Mobile via Wi-Fi</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
