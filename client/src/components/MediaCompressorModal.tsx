import React, { useState } from 'react';
import { X, Minimize2, Loader2, CheckCircle2, AlertCircle, Folder, ExternalLink } from 'lucide-react';

interface MediaCompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  apiBaseUrl: string;
  appSecret: string;
  onOpenFile?: (path: string) => void;
  onShowInFolder?: (path: string) => void;
}

export type CompressionPreset = 'whatsapp' | 'discord_nitro' | 'discord_free' | 'email' | 'custom';

export const MediaCompressorModal: React.FC<MediaCompressorModalProps> = ({
  isOpen,
  onClose,
  filePath,
  fileName,
  apiBaseUrl,
  appSecret,
  onOpenFile,
  onShowInFolder
}) => {
  const [preset, setPreset] = useState<CompressionPreset>('whatsapp');
  const [customMB, setCustomMB] = useState<string>('15');
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    originalSize: string;
    compressedSize: string;
    savingsPercent: number;
    outputPath: string;
    fileName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartCompression = async () => {
    setIsCompressing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/tools/compress-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': appSecret
        },
        body: JSON.stringify({
          filePath,
          targetPreset: preset,
          customSizeMB: preset === 'custom' ? parseFloat(customMB) || 15 : undefined
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Video compression failed');
      }

      setResult({
        originalSize: json.originalSize,
        compressedSize: json.compressedSize,
        savingsPercent: json.savingsPercent,
        outputPath: json.outputPath,
        fileName: json.fileName
      });
    } catch (err: any) {
      setError(err.message || 'Compression error occurred');
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090e]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg cockpit-card rounded-2xl p-6 border border-[rgba(0,229,255,0.25)] shadow-[0_0_50px_rgba(0,229,255,0.12)] space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isCompressing}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.25)] text-[#00e5ff] text-[11px] font-mono font-semibold">
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Smart Social Media Compressor</span>
          </div>
          <h3 className="text-lg font-bold font-display text-white">Optimize & Compress Video</h3>
          <p className="text-xs text-[rgba(240,244,248,0.5)] font-mono truncate max-w-md">
            {fileName}
          </p>
        </div>

        {/* Preset Selector */}
        {!result && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-300 block">
              Choose Target Platform Preset:
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'whatsapp', label: 'WhatsApp Chat/Status', limit: '< 16 MB', color: 'border-emerald-500/40 text-[#00e676]' },
                { id: 'discord_free', label: 'Discord (Free Tier)', limit: '< 8 MB', color: 'border-indigo-500/40 text-indigo-400' },
                { id: 'discord_nitro', label: 'Discord Nitro', limit: '< 25 MB', color: 'border-purple-500/40 text-purple-400' },
                { id: 'email', label: 'Email Attachment', limit: '< 20 MB', color: 'border-sky-500/40 text-sky-400' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id as CompressionPreset)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    preset === item.id
                      ? 'flight-cartridge-active'
                      : 'flight-cartridge'
                  }`}
                >
                  <div className="font-display font-bold text-white text-xs">{item.label}</div>
                  <div className="text-[11px] font-mono text-[#00e5ff] mt-0.5">{item.limit}</div>
                </button>
              ))}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPreset('custom')}
                className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                  preset === 'custom' ? 'flight-cartridge-active' : 'flight-cartridge'
                }`}
              >
                <span className="font-display font-bold text-white">Custom Target File Size</span>
                <span className="font-mono text-[#8290A5]">Specify exact MB</span>
              </button>

              {preset === 'custom' && (
                <div className="flex items-center gap-2 mt-2 bg-[rgba(7,9,14,0.8)] p-2 rounded-xl border border-[rgba(255,255,255,0.08)]">
                  <span className="text-xs font-mono text-zinc-300">Target Size (MB):</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customMB}
                    onChange={(e) => setCustomMB(e.target.value)}
                    className="bg-transparent text-[#00e5ff] font-mono text-xs w-20 border border-[rgba(255,255,255,0.15)] rounded px-2 py-1 focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isCompressing && (
          <div className="p-6 rounded-xl bg-[rgba(7,9,14,0.9)] border border-[rgba(0,229,255,0.2)] flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white font-display">Executing Two-Pass Compression...</h4>
              <p className="text-xs text-[rgba(240,244,248,0.6)] font-mono">FFmpeg is optimizing video stream to fit exact target size</p>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result View */}
        {result && (
          <div className="space-y-4 tab-content-enter">
            <div className="p-4 rounded-xl bg-[rgba(0,230,118,0.08)] border border-[rgba(0,230,118,0.3)] space-y-3">
              <div className="flex items-center gap-2 text-[#00e676]">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-sm font-bold font-display">Compression Complete!</h4>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                <div className="bg-[rgba(7,9,14,0.7)] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-[#8290A5] block">ORIGINAL</span>
                  <span className="text-xs font-bold text-white">{result.originalSize}</span>
                </div>
                <div className="bg-[rgba(7,9,14,0.7)] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-[#8290A5] block">OPTIMIZED</span>
                  <span className="text-xs font-bold text-[#00e676]">{result.compressedSize}</span>
                </div>
                <div className="bg-[rgba(7,9,14,0.7)] p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-[#8290A5] block">SAVED</span>
                  <span className="text-xs font-bold text-[#00e5ff]">-{result.savingsPercent}%</span>
                </div>
              </div>

              <p className="text-xs font-mono text-[rgba(240,244,248,0.6)] truncate">
                Saved: {result.fileName}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {onOpenFile && (
                <button
                  type="button"
                  onClick={() => onOpenFile(result.outputPath)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00e5ff] hover:bg-[#33ebff] text-black transition-all cursor-pointer font-display"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Play Video</span>
                </button>
              )}
              {onShowInFolder && (
                <button
                  type="button"
                  onClick={() => onShowInFolder(result.outputPath)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10 cursor-pointer font-display"
                >
                  <Folder className="w-4 h-4" />
                  <span>Show in Folder</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trigger Button */}
        {!result && (
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCompressing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartCompression}
              disabled={isCompressing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] text-[#07090e] shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all cursor-pointer disabled:opacity-40 font-display"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Start Compression</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
