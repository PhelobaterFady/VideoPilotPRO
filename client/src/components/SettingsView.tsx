import React, { useState } from 'react';
import { Folder, HardDrive, AlertTriangle, CheckCircle, RefreshCw, Sparkles, DownloadCloud, Gauge, ShieldCheck, Zap, Layers, Tag } from 'lucide-react';

export type ThemeType = 'emerald' | 'violet' | 'cyan' | 'crimson';
export type StorageSortMode = 'flat' | 'platform' | 'creator' | 'type';

interface SettingsViewProps {
  downloadPath: string;
  onChangePath: () => void;
  currentVersion?: string;
  onCheckUpdate?: () => Promise<void>;
  updateStatus?: {
    checked: boolean;
    isLatest: boolean;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
    error?: string | null;
  } | null;
  onDownloadUpdate?: (url?: string) => void;
  activeTheme?: ThemeType;
  onSelectTheme?: (theme: ThemeType) => void;
  speedLimit?: string;
  onChangeSpeedLimit?: (limit: string) => void;
  sortMode?: StorageSortMode;
  onChangeSortMode?: (mode: StorageSortMode) => void;
  turboStreams?: number;
  onChangeTurboStreams?: (streams: number) => void;
  embedMetadata?: boolean;
  onChangeEmbedMetadata?: (embed: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  downloadPath,
  onChangePath,
  currentVersion = '1.3.0',
  onCheckUpdate,
  updateStatus,
  onDownloadUpdate,
  activeTheme: _activeTheme = 'cyan',
  onSelectTheme: _onSelectTheme,
  speedLimit = 'unlimited',
  onChangeSpeedLimit,
  sortMode = 'flat',
  onChangeSortMode,
  turboStreams = 16,
  onChangeTurboStreams,
  embedMetadata = true,
  onChangeEmbedMetadata
}) => {
  const [customSpeed, setCustomSpeed] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isConfigured = downloadPath && downloadPath.trim() !== '';

  const handleCheck = async () => {
    setIsChecking(true);
    setFeedbackMessage('Querying release telemetry...');
    if (onCheckUpdate) {
      await onCheckUpdate();
    }
    setTimeout(() => {
      setIsChecking(false);
      setFeedbackMessage('✓ Telemetry synchronization complete!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 800);
  };

  return (
    <div className="w-full space-y-5 tab-content-enter">
      {/* Save Storage Module */}
      <div
        className={`p-5 md:p-6 rounded-3xl border shadow-xl transition-all cockpit-card ${
          isConfigured ? 'border-white/[0.08]' : 'bg-[#FFB020]/10 border-[#FFB020]/40'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isConfigured
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20'
                  : 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/30'
              }`}
            >
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Default Storage Vault</h3>
              <p className="text-xs text-[#8290A5]">Configured destination on your PC where video and audio files are saved</p>
            </div>
          </div>

          <div>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                <CheckCircle className="w-3.5 h-3.5" />
                Storage Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action Required
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#07090E] p-3.5 rounded-2xl border border-white/[0.08]">
          <HardDrive className={`w-5 h-5 flex-shrink-0 ${isConfigured ? 'text-[#00E5FF]' : 'text-[#FFB020]'}`} />
          <span className={`text-xs font-mono truncate flex-1 ${isConfigured ? 'text-zinc-200' : 'text-[#FFB020] font-bold'}`}>
            {isConfigured ? downloadPath : '⚠️ No download folder selected yet! Click "Configure Folder" to begin.'}
          </span>
          <button
            onClick={onChangePath}
            className={`px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all shadow-md cursor-pointer ${
              isConfigured
                ? 'bg-[#00E5FF] hover:bg-[#33ebff] text-black shadow-cyan-500/20'
                : 'bg-[#FFB020] hover:bg-amber-400 text-black shadow-amber-500/30'
            }`}
          >
            {isConfigured ? 'Change Folder' : 'Configure Folder'}
          </button>
        </div>
      </div>

      {/* Auto-Smart Storage Sorter Module */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white">Auto-Smart Storage Sorter</h3>
                <span className="px-2 py-0.5 rounded-md bg-[#00E676]/20 text-[#00E676] text-[10px] font-mono font-bold border border-[#00E676]/30">
                  AUTO-ORGANIZER
                </span>
              </div>
              <p className="text-xs text-[#8290A5]">Automatically categorize files into dedicated subfolders on your workstation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {[
            { id: 'flat', label: '📁 Standard Vault', sub: 'Root download folder', desc: 'All files stored together' },
            { id: 'platform', label: '🌐 By Platform', sub: 'Subfolders by site', desc: '/YouTube, /TikTok, /Instagram' },
            { id: 'creator', label: '👤 By Creator', sub: 'Subfolders by author', desc: 'Auto-grouped by Channel' },
            { id: 'type', label: '🎬 By Media Type', sub: 'Subfolders by format', desc: '/Music, /Videos, /Shorts' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeSortMode && onChangeSortMode(item.id as StorageSortMode)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                sortMode === item.id ? 'flight-cartridge-active' : 'flight-cartridge'
              }`}
            >
              <div>
                <div className="text-xs font-bold font-display text-white">{item.label}</div>
                <div className="text-[11px] font-mono text-[#00E5FF] mt-0.5">{item.sub}</div>
              </div>
              <div className="text-[10px] font-mono text-[#8290A5] border-t border-white/5 pt-1.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Turbo Multi-Threading & Audio-Visual Engine Module */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
              <Zap className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white">Turbo Parallel Streams & Metadata</h3>
                <span className="px-2 py-0.5 rounded-md bg-[#00E5FF]/20 text-[#00E5FF] text-[10px] font-mono font-bold border border-[#00E5FF]/30">
                  TURBO MATRIX
                </span>
              </div>
              <p className="text-xs text-[#8290A5]">Multi-threaded fragment downloads and ID3 album cover auto-embedding</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { count: 4, label: 'Standard (4 Streams)', sub: 'Low CPU impact' },
            { count: 8, label: 'High Speed (8 Streams)', sub: 'Fast parallel chunks' },
            { count: 16, label: '👑 Turbo (16 Streams)', sub: 'Maximum throughput (IDM Style)' }
          ].map((streamOpt) => (
            <button
              key={streamOpt.count}
              type="button"
              onClick={() => onChangeTurboStreams && onChangeTurboStreams(streamOpt.count)}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                turboStreams === streamOpt.count ? 'flight-cartridge-active' : 'flight-cartridge'
              }`}
            >
              <span className="text-xs font-bold font-display text-white">{streamOpt.label}</span>
              <span className="text-[10px] font-mono text-[#00E5FF]">{streamOpt.sub}</span>
            </button>
          ))}
        </div>

        {/* Auto ID3 Embedder Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#07090E] border border-white/[0.08] mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-[#00E5FF]">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-display text-white">Auto-ID3 Metadata & Album Art Embedder</div>
              <div className="text-[11px] font-mono text-[#8290A5]">Automatically embed high-res cover art, artist, and track title into MP3/M4A</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChangeEmbedMetadata && onChangeEmbedMetadata(!embedMetadata)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              embedMetadata
                ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40'
                : 'bg-white/5 text-zinc-500 border border-white/10'
            }`}
          >
            {embedMetadata ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* Speed Limiter & Telemetry Control */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-bold text-white">Bandwidth Throttle & Limiter</h3>
                <span className="px-2 py-0.5 rounded-md bg-[#00E5FF]/20 text-[#00E5FF] text-[10px] font-mono font-bold border border-[#00E5FF]/30">
                  RATE CONTROL
                </span>
              </div>
              <p className="text-xs text-[#8290A5]">Control transfer bitrate to preserve network stability for other devices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {[
            { id: 'unlimited', label: '⚡ Unlimited', sub: 'Max Speed' },
            { id: '1M', label: '1 MB/s', sub: 'Low Impact' },
            { id: '3M', label: '3 MB/s', sub: 'Balanced' },
            { id: '5M', label: '5 MB/s', sub: 'High Speed' },
            { id: '10M', label: '10 MB/s', sub: 'Very Fast' },
            { id: 'custom', label: '⚙️ Custom', sub: 'Specific Rate' }
          ].map((opt) => {
            const isSelected =
              opt.id === 'custom'
                ? !['unlimited', '1M', '3M', '5M', '10M'].includes(speedLimit)
                : speedLimit === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === 'custom') {
                    const target = customSpeed ? `${customSpeed}M` : '2M';
                    onChangeSpeedLimit && onChangeSpeedLimit(target);
                  } else {
                    onChangeSpeedLimit && onChangeSpeedLimit(opt.id);
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'flight-cartridge-active'
                    : 'flight-cartridge'
                }`}
              >
                <span className="text-xs font-bold font-display text-white">{opt.label}</span>
                <span className="text-[10px] font-mono text-[#8290A5]">{opt.sub}</span>
              </button>
            );
          })}
        </div>

        {!['unlimited', '1M', '3M', '5M', '10M'].includes(speedLimit) && (
          <div className="flex items-center gap-3 pt-2 bg-[#07090E] p-3 rounded-xl border border-white/[0.08]">
            <span className="text-xs font-mono text-zinc-300">Custom Limit (MB/s):</span>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 4"
              value={customSpeed}
              onChange={(e) => {
                setCustomSpeed(e.target.value);
                if (e.target.value && parseInt(e.target.value) > 0) {
                  onChangeSpeedLimit && onChangeSpeedLimit(`${e.target.value}M`);
                }
              }}
              className="w-24 px-3 py-1.5 rounded-lg bg-[#0E131F] border border-white/[0.1] text-xs text-white font-mono focus:outline-none focus:border-[#00E5FF]"
            />
            <span className="text-xs font-mono text-[#8290A5]">MB/s per video stream</span>
          </div>
        )}
      </div>

      {/* Engine & Firmware Updates */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Engine Telemetry & Updates</h3>
              <p className="text-xs text-[#8290A5]">
                Current Installed Deck: <span className="font-mono text-[#00E5FF] font-bold">v{currentVersion}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all border border-white/[0.1] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-[#00E5FF]' : ''}`} />
              <span>{isChecking ? 'Checking Telemetry...' : 'Check For Updates'}</span>
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="p-3 rounded-xl bg-[#07090E] border border-white/[0.08] text-xs font-mono text-[#00E5FF] animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {updateStatus?.checked && (
          <div>
            {updateStatus.error ? (
              <div className="p-4 rounded-2xl border bg-[#FFB020]/10 border-[#FFB020]/30 text-amber-300 text-xs font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FFB020] flex-shrink-0" />
                  <span>{updateStatus.error}</span>
                </div>
                <button
                  onClick={handleCheck}
                  className="px-3 py-1.5 rounded-lg bg-[#FFB020]/20 hover:bg-[#FFB020]/30 text-[#FFB020] font-bold border border-[#FFB020]/30 text-xs flex-shrink-0 font-mono"
                >
                  Retry
                </button>
              </div>
            ) : updateStatus.isLatest ? (
              <div className="p-4 rounded-2xl border bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676] text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#00E676] flex-shrink-0" />
                <span>You are running the latest calibrated release of Video Pilot Pro (v{currentVersion}).</span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-[#00E5FF]/40 text-cyan-200 text-xs font-medium space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00E5FF] animate-pulse flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white text-sm font-display">New Engine Build (v{updateStatus.latestVersion || '1.3.0'}) Available!</span>
                      <p className="text-[11px] text-[#8290A5]">Upgrade to ensure uninterrupted compatibility with YouTube, TikTok, and Instagram.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onDownloadUpdate) {
                        onDownloadUpdate(updateStatus.downloadUrl);
                      } else {
                        window.open(updateStatus.downloadUrl || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest', '_blank');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#33ebff] text-black font-display font-bold text-xs shadow-lg transition-all"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Download Package</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Core Systems Telemetry */}
      <div className="cockpit-card p-5 md:p-6 rounded-3xl border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00E676]/10 text-[#00E676] flex items-center justify-center border border-[#00E676]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white">Core Engine Architecture</h3>
            <p className="text-xs text-[#8290A5]">Embedded processing runtimes and stream encoders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08] flex items-center justify-between">
            <span className="text-[#8290A5]">yt-dlp Core Parser</span>
            <span className="px-2.5 py-1 rounded-full bg-[#00E676]/15 text-[#00E676] font-bold border border-[#00E676]/30">
              v2026.8.19 Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#07090E] border border-white/[0.08] flex items-center justify-between">
            <span className="text-[#8290A5]">FFmpeg Audio/Video Merger</span>
            <span className="px-2.5 py-1 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] font-bold border border-[#00E5FF]/30">
              FFmpeg 7.0 Static
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
