import React, { useState } from 'react';
import { Folder, HardDrive, Cpu, AlertTriangle, CheckCircle, RefreshCw, Sparkles, DownloadCloud, Palette, Check, Gauge } from 'lucide-react';

export type ThemeType = 'emerald' | 'violet' | 'cyan' | 'crimson';

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
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  downloadPath,
  onChangePath,
  currentVersion = '1.2.0',
  onCheckUpdate,
  updateStatus,
  onDownloadUpdate,
  activeTheme = 'emerald',
  onSelectTheme,
  speedLimit = 'unlimited',
  onChangeSpeedLimit
}) => {
  const [customSpeed, setCustomSpeed] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isConfigured = downloadPath && downloadPath.trim() !== '';

  const handleCheck = async () => {
    setIsChecking(true);
    setFeedbackMessage('Connecting to update server...');
    if (onCheckUpdate) {
      await onCheckUpdate();
    }
    setTimeout(() => {
      setIsChecking(false);
      setFeedbackMessage('✓ Update check completed!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 800);
  };

  const themes: { id: ThemeType; name: string; gradient: string; accentColor: string; description: string }[] = [
    {
      id: 'emerald',
      name: 'Emerald Cyber (Default)',
      gradient: 'from-emerald-500 to-teal-600',
      accentColor: '#10b981',
      description: 'Futuristic neon green accents with deep obsidian background'
    },
    {
      id: 'violet',
      name: 'Electric Violet',
      gradient: 'from-purple-500 to-indigo-600',
      accentColor: '#a855f7',
      description: 'Vibrant purple & indigo tones for a sleek creative aesthetic'
    },
    {
      id: 'cyan',
      name: 'Cyberpunk Cyan',
      gradient: 'from-cyan-400 to-blue-600',
      accentColor: '#06b6d4',
      description: 'High-tech sky blue and cyan glow inspired by futuristic UI'
    },
    {
      id: 'crimson',
      name: 'Sunset Crimson',
      gradient: 'from-rose-500 to-amber-600',
      accentColor: '#f43f5e',
      description: 'Warm crimson and fiery gold accents for high contrast'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Save Storage Settings */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all ${
        isConfigured ? 'bg-zinc-900/60 border-zinc-800' : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isConfigured ? 'bg-zinc-800 text-emerald-400 border-zinc-700' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Default Download Location</h3>
              <p className="text-xs text-zinc-400">Select the folder on your PC where downloaded media will be stored automatically</p>
            </div>
          </div>

          <div>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Folder Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action Required
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black p-3.5 rounded-2xl border border-zinc-800">
          <HardDrive className={`w-5 h-5 flex-shrink-0 ${isConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className={`text-xs font-mono truncate flex-1 ${isConfigured ? 'text-zinc-200' : 'text-amber-400 font-bold'}`}>
            {isConfigured ? downloadPath : '⚠️ No download folder selected yet! Click "Select Folder" to configure.'}
          </span>
          <button
            onClick={onChangePath}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow ${
              isConfigured
                ? 'bg-zinc-100 hover:bg-white text-zinc-950'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            {isConfigured ? 'Change Folder' : 'Select Storage Folder'}
          </button>
        </div>
      </div>

      {/* Download Speed Limiter & Bandwidth Control */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-cyan-400 flex items-center justify-center border border-zinc-700">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Download Speed Limiter & Bandwidth</h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold border border-cyan-500/30">NEW</span>
              </div>
              <p className="text-xs text-zinc-400">Throttle download speed to preserve network bandwidth for other devices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          {[
            { id: 'unlimited', label: '⚡ Unlimited', sub: 'Max Speed' },
            { id: '1M', label: '1 MB/s', sub: 'Low impact' },
            { id: '3M', label: '3 MB/s', sub: 'Balanced' },
            { id: '5M', label: '5 MB/s', sub: 'High Speed' },
            { id: '10M', label: '10 MB/s', sub: 'Very Fast' },
            { id: 'custom', label: '⚙️ Custom', sub: 'Specific rate' }
          ].map(opt => {
            const isSelected = opt.id === 'custom'
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
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-500/10 scale-[1.02]'
                    : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.sub}</span>
              </button>
            );
          })}
        </div>

        {!['unlimited', '1M', '3M', '5M', '10M'].includes(speedLimit) && (
          <div className="flex items-center gap-3 pt-2 bg-black/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-300">Custom Limit (MB/s):</span>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 2"
              value={customSpeed}
              onChange={(e) => {
                setCustomSpeed(e.target.value);
                if (e.target.value && parseInt(e.target.value) > 0) {
                  onChangeSpeedLimit && onChangeSpeedLimit(`${e.target.value}M`);
                }
              }}
              className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-zinc-500">MB/s per stream</span>
          </div>
        )}
      </div>

      {/* Theme Customization (NEW FEATURE v1.1.0) */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-purple-400 flex items-center justify-center border border-zinc-700">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Interface Customization & Themes</h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/30">NEW v1.1.0</span>
              </div>
              <p className="text-xs text-zinc-400">Choose your preferred visual color theme for VideoPilot Pro</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {themes.map(t => {
            const isSelected = activeTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTheme && onSelectTheme(t.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-zinc-800/80 border-purple-500 shadow-lg shadow-purple-500/10 scale-[1.02]'
                    : 'bg-black/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${t.gradient} shadow`} />
                    <span className="text-xs font-bold text-white">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{t.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Update Center */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Application Updates & Version Control</h3>
              <p className="text-xs text-zinc-400">Current Installed Version: <span className="font-mono text-emerald-400 font-bold">v{currentVersion}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check for Updates'}</span>
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-medium text-emerald-400 animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {updateStatus?.checked && (
          <div>
            {updateStatus.error ? (
              <div className="p-4 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{updateStatus.error}</span>
                </div>
                <button
                  onClick={handleCheck}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 text-xs flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            ) : updateStatus.isLatest ? (
              <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>You are running the latest version of Video Pilot Pro (v{currentVersion}).</span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/50 text-emerald-200 text-xs font-medium space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white text-sm">A new version (v{updateStatus.latestVersion || '1.2.0'}) is ready!</span>
                      <p className="text-[11px] text-emerald-300/80">Upgrade to access the latest features and platform compatibility.</p>
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg transition-all"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Download & Update</span>
                  </button>
                </div>
                {updateStatus.releaseNotes && (
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-zinc-300">
                    <span className="font-semibold text-emerald-400">Release Notes: </span>
                    {updateStatus.releaseNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Engine Status */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-emerald-400 flex items-center justify-center border border-zinc-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">System Engine Status</h3>
            <p className="text-xs text-zinc-400">Core media parser and streaming engines status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400 font-medium">yt-dlp Core Parser</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Active & Updated
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400 font-medium">FFmpeg Audio/Video Engine</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Integrated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
