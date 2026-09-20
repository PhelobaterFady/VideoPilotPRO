import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Smartphone, Radio } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090e]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md cockpit-card rounded-2xl p-6 border border-[rgba(0,229,255,0.25)] shadow-[0_0_50px_rgba(0,229,255,0.12)] space-y-5 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.25)] text-[#00e5ff] text-[11px] font-mono font-semibold">
            <Radio className="w-3 h-3 animate-pulse text-[#00e5ff]" />
            <span>Wi-Fi Direct Studio Link</span>
          </div>
          <h3 className="text-xl font-bold font-display text-white flex items-center justify-center gap-2.5">
            <Smartphone className="w-5 h-5 text-[#00e5ff]" />
            <span>Beam to Mobile Device</span>
          </h3>
          <p className="text-xs text-[rgba(240,244,248,0.5)] truncate px-4 font-mono">
            {fileName}
          </p>
        </div>

        {/* QR Code Container with Precision Framing */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.15)] border-2 border-[#00e5ff]/40 w-64 h-64 mx-auto relative group">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR Code to download"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
              <QrCode className="w-12 h-12 animate-pulse text-[#00e5ff]" />
              <span className="text-xs font-mono">Generating Matrix...</span>
            </div>
          )}
        </div>

        {/* Instruction Telemetry */}
        <div className="bg-[rgba(10,14,23,0.9)] p-3.5 rounded-xl border border-[rgba(255,255,255,0.06)] text-left space-y-2 font-sans">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[rgba(0,229,255,0.15)] text-[#00e5ff] flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 border border-[rgba(0,229,255,0.25)]">
              1
            </div>
            <p className="text-xs text-[rgba(240,244,248,0.7)] leading-relaxed">
              Connect phone to same local network subnet: <strong className="text-white font-mono">{localIp}</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[rgba(0,229,255,0.15)] text-[#00e5ff] flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 mt-0.5 border border-[rgba(0,229,255,0.25)]">
              2
            </div>
            <p className="text-xs text-[rgba(240,244,248,0.7)] leading-relaxed">
              Scan with your phone's camera to trigger instant unthrottled local stream.
            </p>
          </div>
        </div>

        {/* Direct Link Copy Bar */}
        <div className="flex items-center gap-2 bg-[rgba(7,9,14,0.9)] p-1.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <input
            type="text"
            readOnly
            value={transferUrl}
            className="w-full bg-transparent text-xs text-[rgba(240,244,248,0.6)] font-mono px-2 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-white transition-all flex-shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5 text-[#00e5ff]" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
