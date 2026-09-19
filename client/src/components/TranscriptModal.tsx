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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-4 border-b border-zinc-800 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Video Transcript & Subtitles</h3>
              <p className="text-xs text-zinc-400 line-clamp-1 max-w-lg">{videoTitle}</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Language, Search & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  loadTranscript(e.target.value);
                }}
                className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="en">English (Default)</option>
                <option value="ar">Arabic (العربية)</option>
                {availableSubtitles.map(sub => (
                  <option key={sub.code} value={sub.code}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-xl">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find text..."
                className="bg-transparent text-xs text-white focus:outline-none w-28 md:w-36"
              />
            </div>
          </div>

          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveView('plain')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === 'plain' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Plain Text (.txt)
            </button>
            <button
              onClick={() => setActiveView('srt')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === 'srt' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Subtitles (.srt)
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto my-4 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap select-text min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs">Extracting transcripts & captions...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400 text-center px-4">
              <p className="text-red-400 font-bold">{error}</p>
              <p className="text-[11px] text-zinc-500">Try switching to another language or check if this video has speech/captions.</p>
            </div>
          ) : (
            displayedText || 'No transcript text available.'
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={handleCopy}
            disabled={loading || !!error}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy All Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('txt')}
              disabled={loading || !!error || !plainText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Save .TXT</span>
            </button>
            <button
              onClick={() => handleSave('srt')}
              disabled={loading || !!error || !srtText}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Save .SRT Subtitles</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
