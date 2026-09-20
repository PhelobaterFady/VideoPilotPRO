import React, { useState } from 'react';
import { X, FileText, Copy, Check, Download, Search, Globe, Loader2 } from 'lucide-react';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoUrl: string;
  availableSubtitles?: { code: string; name: string }[];
  onSaveTranscript: (title: string, content: string, format: 'txt' | 'srt') => Promise<void>;
  apiBaseUrl: string;
  appSecret: string;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  videoUrl,
  availableSubtitles = [],
  onSaveTranscript,
  apiBaseUrl,
  appSecret
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [loading, setLoading] = useState<boolean>(false);
  const [plainText, setPlainText] = useState<string>('');
  const [srtText, setSrtText] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'plain' | 'srt'>('plain');

  React.useEffect(() => {
    if (isOpen && videoUrl) {
      loadTranscript(selectedLang);
    }
  }, [isOpen, videoUrl]);

  const loadTranscript = async (lang: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': appSecret
        },
        body: JSON.stringify({ url: videoUrl, lang })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to extract transcript');
      }

      setPlainText(json.text || '');
      setSrtText(json.srt || '');
    } catch (err: any) {
      setError(err.message || 'Could not load transcript for this video.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = activeView === 'plain' ? plainText : srtText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (format: 'txt' | 'srt') => {
    const content = format === 'txt' ? plainText : srtText;
    await onSaveTranscript(videoTitle, content, format);
  };

  const displayedText = React.useMemo(() => {
    const raw = activeView === 'plain' ? plainText : srtText;
    if (!searchTerm.trim()) return raw;
    const lines = raw.split('\n');
    const matched = lines.filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()));
    return matched.length > 0 ? matched.join('\n') : `No matches found for "${searchTerm}".`;
  }, [plainText, srtText, activeView, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07090e]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl cockpit-card rounded-2xl p-6 border border-[rgba(0,229,255,0.25)] shadow-[0_0_50px_rgba(0,229,255,0.1)] flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-zinc-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-[rgba(255,255,255,0.06)] space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(0,229,255,0.08)] text-[#00e5ff] flex items-center justify-center border border-[rgba(0,229,255,0.25)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Video Transcript & Subtitles Engine</h3>
              <p className="text-xs text-[rgba(240,244,248,0.5)] line-clamp-1 max-w-lg font-mono">{videoTitle}</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Language, Search & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[rgba(7,9,14,0.7)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
              <Globe className="w-3.5 h-3.5 text-[#00e5ff]" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  loadTranscript(e.target.value);
                }}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer font-mono"
              >
                <option value="en" className="bg-[#0e131f]">English (Auto)</option>
                <option value="ar" className="bg-[#0e131f]">Arabic (العربية)</option>
                {availableSubtitles.map(sub => (
                  <option key={sub.code} value={sub.code} className="bg-[#0e131f]">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[rgba(7,9,14,0.7)] border border-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-lg">
              <Search className="w-3.5 h-3.5 text-[rgba(240,244,248,0.4)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find in dialogue..."
                className="bg-transparent text-xs text-white focus:outline-none w-28 md:w-36 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center bg-[rgba(7,9,14,0.8)] p-0.5 rounded-lg border border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setActiveView('plain')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeView === 'plain'
                  ? 'bg-[#00e5ff] text-[#07090e] font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-[rgba(240,244,248,0.5)] hover:text-white'
              }`}
            >
              Plain Text (.txt)
            </button>
            <button
              onClick={() => setActiveView('srt')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeView === 'srt'
                  ? 'bg-[#00e5ff] text-[#07090e] font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'text-[rgba(240,244,248,0.5)] hover:text-white'
              }`}
            >
              Subtitles (.srt)
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-[rgba(7,9,14,0.85)] border border-[rgba(255,255,255,0.06)] font-mono text-xs text-[rgba(240,244,248,0.75)] leading-relaxed whitespace-pre-wrap select-text min-h-[220px] custom-aerospace-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#00e5ff]" />
              <span className="text-xs font-mono">Extracting transcripts & captions telemetry...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400 text-center px-4">
              <p className="text-[#ff5252] font-semibold">{error}</p>
              <p className="text-[11px] text-[rgba(240,244,248,0.4)]">Try switching language or verify if the source media contains caption tracks.</p>
            </div>
          ) : (
            displayedText || 'No transcript text available.'
          )}
        </div>

        {/* Action Dock */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button
            onClick={handleCopy}
            disabled={loading || !!error}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-zinc-200 transition-all disabled:opacity-40 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#00e676]" /> : <Copy className="w-4 h-4 text-[#00e5ff]" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy All Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('txt')}
              disabled={loading || !!error || !plainText}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[rgba(0,229,255,0.08)] hover:bg-[rgba(0,229,255,0.15)] text-[#00e5ff] border border-[rgba(0,229,255,0.25)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save .TXT</span>
            </button>
            <button
              onClick={() => handleSave('srt')}
              disabled={loading || !!error || !srtText}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] text-[#07090e] shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save .SRT Subtitles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
