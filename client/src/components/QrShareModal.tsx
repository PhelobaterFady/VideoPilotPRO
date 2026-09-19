import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Smartphone, Wifi } from 'lucide-react';

interface QrShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  transferUrl: string;
  fileName: string;
  localIp: string;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  transferUrl,
  fileName,
  localIp
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transferUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-card rounded-3xl p-6 border border-zinc-800 shadow-2xl space-y-5 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi Direct Transfer</span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Send to Phone</span>
          </h3>
          <p className="text-xs text-zinc-400 truncate px-4 font-mono">
            {fileName}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner border border-zinc-300 w-64 h-64 mx-auto relative group">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR Code to download"
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
              <QrCode className="w-12 h-12 animate-pulse" />
              <span className="text-xs font-semibold">Generating QR Code...</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 text-left space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
              1
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Connect your phone to the same <strong>Wi-Fi</strong> ({localIp}).
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
              2
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Open your phone's <strong>Camera</strong> or QR scanner and scan the code.
            </p>
          </div>
        </div>

        {/* Direct Link Copy */}
        <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
          <input
            type="text"
            readOnly
            value={transferUrl}
            className="w-full bg-transparent text-xs text-zinc-400 font-mono px-2 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
