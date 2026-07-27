import React, { useState } from 'react';
import { Folder, HardDrive, Cpu, AlertTriangle, CheckCircle, RefreshCw, Sparkles, DownloadCloud } from 'lucide-react';

interface SettingsViewProps {
  downloadPath: string;
  onChangePath: () => void;
  currentVersion?: string;
  onCheckUpdate?: () => Promise<void>;
  updateStatus?: { checked: boolean; isLatest: boolean; latestVersion?: string; downloadUrl?: string } | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  downloadPath,
  onChangePath,
  currentVersion = '1.0.0',
  onCheckUpdate,
  updateStatus
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const isConfigured = downloadPath && downloadPath.trim() !== '';

  const handleCheck = async () => {
    if (onCheckUpdate) {
      setIsChecking(true);
      await onCheckUpdate();
      setIsChecking(false);
    }
  };

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

          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Updates...' : 'Check for Updates'}</span>
          </button>
        </div>

        {updateStatus?.checked && (
          <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            updateStatus.isLatest
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500/50 text-emerald-200'
          }`}>
            {updateStatus.isLatest ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>You are running the latest version of VideoPilot Pro (v{currentVersion}).</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>A new update (v{updateStatus.latestVersion}) is available!</span>
                </div>
                <button
                  onClick={() => {
                    if ((window as any).require) {
                      try {
                        const { ipcRenderer } = (window as any).require('electron');
                        ipcRenderer.send('restart-and-update');
                        return;
                      } catch (e) {}
                    }
                    window.open(updateStatus.downloadUrl || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest', '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Update Now</span>
                </button>
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
