import { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { UrlInput } from './components/UrlInput';
import { VideoPreviewCard } from './components/VideoPreviewCard';
import { PlaylistView } from './components/PlaylistView';
import { BatchDownloader } from './components/BatchDownloader';
import { ProgressQueue } from './components/ProgressQueue';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import type { MediaInfo, DownloadQueueItem, HistoryItem, PlaylistItem } from './types';
import { Sparkles, AlertTriangle, ArrowRight, Folder } from 'lucide-react';

const APP_SECRET = 'VP_PRO_APP_SECRET_2026';
// Handle local file protocol when loaded inside Electron app
const API_BASE_URL = typeof window !== 'undefined' && window.location.protocol.startsWith('file') ? 'http://localhost:5000' : '';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('downloader');
  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadQueue, setDownloadQueue] = useState<DownloadQueueItem[]>([]);
  
  const [downloadPath, setDownloadPath] = useState<string>(() => {
    return localStorage.getItem('videopilot_download_path') || '';
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('videopilot_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('videopilot_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('videopilot_download_path', downloadPath);
  }, [downloadPath]);

  const handleSelectFolder = async () => {
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const selected = await ipcRenderer.invoke('select-folder');
        if (selected) {
          setDownloadPath(selected);
          setErrorMessage(null);
          return;
        }
      } catch (err) {
        console.warn('IPC select-folder failed, using prompt fallback');
      }
    }
    
    const custom = prompt('Enter PC output directory path (e.g. C:/Downloads or D:/Media):', downloadPath || 'C:/Downloads');
    if (custom) {
      setDownloadPath(custom);
      setErrorMessage(null);
    }
  };

  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentMedia(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ url })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract media information. Please check the URL.');
      }

      setCurrentMedia(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while analyzing the link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeBatch = async (urls: string[]) => {
    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/batch-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ urls })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Batch analysis failed.');
      }

      json.items.forEach((item: any) => {
        if (item.success && item.data) {
          triggerSingleDownload(
            item.data.webpage_url || item.url,
            'best',
            false,
            item.data.title,
            item.data.platform
          );
        }
      });

      setActiveTab('downloader');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing batch links.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSingleDownload = async (
    url: string,
    format: string,
    isAudio: boolean,
    title: string,
    platform = currentMedia?.platform || 'unknown'
  ) => {
    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }

    const queueId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newQueueItem: DownloadQueueItem = {
      id: queueId,
      title,
      url,
      platform,
      format,
      quality: isAudio ? 'MP3 320kbps' : 'Best Quality',
      isAudio,
      progress: 20,
      speed: 'Downloading...',
      eta: '--:--',
      status: 'downloading',
      thumbnail: currentMedia?.thumbnail,
      outputDir: downloadPath
    };

    setDownloadQueue(prev => [newQueueItem, ...prev]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({
          url,
          format,
          audioOnly: isAudio,
          title,
          outputDir: downloadPath
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Download failed');
      }

      setDownloadQueue(prev =>
        prev.map(q => q.id === queueId ? { ...q, progress: 100, status: 'completed', speed: 'Saved' } : q)
      );

      const newHistoryItem: HistoryItem = {
        id: queueId,
        title,
        url,
        platform,
        type: isAudio ? 'audio' : 'video',
        downloadDate: new Date().toISOString(),
        format: isAudio ? 'MP3' : 'MP4',
        thumbnail: currentMedia?.thumbnail || ''
      };

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
    } catch (err: any) {
      console.error('Download execution error:', err);
      setDownloadQueue(prev =>
        prev.map(q => q.id === queueId ? { ...q, status: 'error', errorMessage: err.message || 'Download failed' } : q)
      );
    }
  };

  const handleBatchPlaylistDownload = (items: PlaylistItem[], isAudio: boolean, format: string) => {
    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }
    items.forEach(item => {
      triggerSingleDownload(item.url, format, isAudio, item.title, currentMedia?.platform || 'youtube');
    });
  };

  const activeDownloads = downloadQueue.filter(i => i.status === 'downloading').length;

  return (
    <div className="h-screen w-screen bg-[#050505] text-zinc-100 flex flex-col overflow-hidden select-none">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeDownloadsCount={activeDownloads}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
          {(!downloadPath || downloadPath.trim() === '') && (
            <div className="max-w-5xl mx-auto mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Download Save Location Not Configured</h4>
                  <p className="text-xs text-amber-400/80">Please specify where to save videos on your PC before downloading.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow flex-shrink-0"
              >
                <Folder className="w-4 h-4" />
                <span>Go to Settings & Storage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'downloader' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Direct Downloader</h2>
                  <p className="text-xs text-zinc-400">Paste media URL from YouTube, TikTok, Instagram, Facebook, or X</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-emerald-400 border border-zinc-700">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Protected Engine</span>
                </div>
              </div>

              <UrlInput onAnalyze={handleAnalyzeUrl} isLoading={isLoading} />

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center shadow flex items-center justify-between gap-4">
                  <span>{errorMessage}</span>
                  {(!downloadPath || downloadPath.trim() === '') && (
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold text-xs"
                    >
                      Set Storage Path
                    </button>
                  )}
                </div>
              )}

              {currentMedia && (
                <>
                  {currentMedia.type === 'playlist' ? (
                    <PlaylistView playlist={currentMedia} onBatchDownload={handleBatchPlaylistDownload} />
                  ) : (
                    <VideoPreviewCard media={currentMedia} onDownload={triggerSingleDownload} />
                  )}
                </>
              )}

              <ProgressQueue
                queue={downloadQueue}
                onClearCompleted={() => setDownloadQueue(prev => prev.filter(i => i.status !== 'completed'))}
              />
            </div>
          )}

          {activeTab === 'batch' && (
            <BatchDownloader
              onAnalyzeBatch={handleAnalyzeBatch}
              isLoading={isLoading}
              onClose={() => setActiveTab('downloader')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onClearHistory={() => setHistory([])}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              downloadPath={downloadPath}
              onChangePath={handleSelectFolder}
            />
          )}
        </main>
      </div>

      <StatusBar downloadPath={downloadPath || 'Not Configured (Set in Settings)'} activeCount={activeDownloads} />
    </div>
  );
}

export default App;
