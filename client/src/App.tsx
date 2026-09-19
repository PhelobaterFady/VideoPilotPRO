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
import type { ThemeType } from './components/SettingsView';
import type { MediaInfo, DownloadQueueItem, HistoryItem, PlaylistItem, PlatformType } from './types';
import { Sparkles, AlertTriangle, ArrowRight, Folder, RefreshCw, DownloadCloud, ClipboardCopy, X } from 'lucide-react';

const APP_SECRET = 'VP_PRO_APP_SECRET_2026';
const CURRENT_VERSION = '1.2.0';
const API_BASE_URL = typeof window !== 'undefined' && window.location.protocol.startsWith('file') ? 'http://localhost:5000' : '';

function isVersionNewer(latest?: string, current: string = CURRENT_VERSION): boolean {
  if (!latest || !current) return false;
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const l = parse(latest);
  const c = parse(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lVal = l[i] !== undefined ? l[i] : 0;
    const cVal = c[i] !== undefined ? c[i] : 0;
    if (lVal > cVal) return true;
    if (lVal < cVal) return false;
  }
  return false;
}

const openExternalUrl = async (url: string) => {
  if (!url) return;
  if ((window as any).require) {
    try {
      const { ipcRenderer } = (window as any).require('electron');
      const res = await ipcRenderer.invoke('open-external', url);
      if (res && res.success) return;
    } catch (e) {
      console.warn('IPC open-external failed, falling back to window.open', e);
    }
  }
  window.open(url, '_blank');
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('downloader');
  const [currentMedia, setCurrentMedia] = useState<MediaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadQueue, setDownloadQueue] = useState<DownloadQueueItem[]>([]);
  
  const [clipboardDetectedUrl, setClipboardDetectedUrl] = useState<string | null>(null);
  const [dismissedClipboardUrl, setDismissedClipboardUrl] = useState<string | null>(null);



  const [updateInfo, setUpdateInfo] = useState<{ available: boolean; version?: string; url?: string } | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    checked: boolean;
    isLatest: boolean;
    latestVersion?: string;
    downloadUrl?: string;
    releaseNotes?: string;
    error?: string | null;
  } | null>(null);

  const [activeTheme, setActiveTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('videopilot_theme') as ThemeType) || 'emerald';
  });

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

  useEffect(() => {
    localStorage.setItem('videopilot_theme', activeTheme);
  }, [activeTheme]);

  const handleTriggerUpdate = (downloadUrl?: string) => {
    if (updateInfo?.url === 'ready') {
      if ((window as any).require) {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          ipcRenderer.send('restart-and-update');
          return;
        } catch (e) {}
      }
    }
    const targetUrl = downloadUrl || updateStatus?.downloadUrl || updateInfo?.url || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest';
    openExternalUrl(targetUrl);
  };

  const checkVersionRealtime = async () => {
    // 1. Electron IPC Check (Calls electron-updater if configured)
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('check-for-updates');
      } catch (e) {
        console.warn('IPC check error:', e);
      }
    }

    // 2. Hybrid API Check (Queries Express / Vercel endpoint)
    try {
      const res = await fetch(`${API_BASE_URL}/api/version`).catch(() => fetch('/api/version'));
      if (res && res.ok) {
        const json = await res.json();
        if (json && json.latestVersion) {
          const isNewer = isVersionNewer(json.latestVersion, CURRENT_VERSION);
          setUpdateStatus({
            checked: true,
            isLatest: !isNewer,
            latestVersion: json.latestVersion,
            downloadUrl: json.downloadUrl || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
            releaseNotes: json.releaseNotes,
            error: null
          });

          if (isNewer) {
            setUpdateInfo({
              available: true,
              version: json.latestVersion,
              url: json.downloadUrl || 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest'
            });
          }
          return;
        }
      }
    } catch (e: any) {
      console.warn('API version check fetch error:', e);
    }

    // Fallback if not already set
    setUpdateStatus((prev) => {
      if (prev?.latestVersion && !prev.isLatest) return prev;
      return {
        checked: true,
        isLatest: true,
        latestVersion: CURRENT_VERSION,
        downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest',
        error: null
      };
    });
  };

  // Version Check on mount & IPC setup
  useEffect(() => {
    checkVersionRealtime();

    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.on('update-available', (_: any, info: any) => {
          const ver = info?.version || '1.2.0';
          setUpdateInfo({ available: true, version: ver });
          setUpdateStatus({
            checked: true,
            isLatest: false,
            latestVersion: ver,
            downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest'
          });
        });

        ipcRenderer.on('update-ready', (_: any, info: any) => {
          const ver = info?.version || '1.2.0';
          setUpdateInfo({ available: true, version: ver, url: 'ready' });
          setUpdateStatus({
            checked: true,
            isLatest: false,
            latestVersion: ver,
            downloadUrl: 'ready'
          });
        });

        ipcRenderer.on('update-check-result', (_: any, result: any) => {
          if (result && result.available && result.version) {
            const isNewer = isVersionNewer(result.version, CURRENT_VERSION);
            if (isNewer) {
              setUpdateStatus({
                checked: true,
                isLatest: false,
                latestVersion: result.version,
                downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest'
              });
              setUpdateInfo({ available: true, version: result.version });
            }
          }
        });
      } catch (e) {
        // IPC listener fallback
      }
    }
  }, []);

  // Auto-detect media links copied to clipboard
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) return;
        const text = await navigator.clipboard.readText();
        if (!text) return;
        const trimmed = text.trim();
        if (
          (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
          /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|vimeo\.com|soundcloud\.com)/i.test(trimmed) &&
          trimmed !== dismissedClipboardUrl &&
          trimmed !== currentMedia?.webpage_url
        ) {
          setClipboardDetectedUrl(trimmed);
        }
      } catch (e) {
        // Clipboard access might be denied or unsupported
      }
    };

    window.addEventListener('focus', checkClipboard);
    const interval = setInterval(checkClipboard, 3000);

    return () => {
      window.removeEventListener('focus', checkClipboard);
      clearInterval(interval);
    };
  }, [dismissedClipboardUrl, currentMedia]);

  const handleOpenFile = async (filePath: string) => {
    if (!filePath) return;
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        await ipcRenderer.invoke('open-file', filePath);
        return;
      } catch (e) {
        console.warn('IPC open-file failed:', e);
      }
    }
  };

  const handleShowInFolder = async (filePath: string) => {
    if (!filePath) return;
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        await ipcRenderer.invoke('show-in-folder', filePath);
        return;
      } catch (e) {
        console.warn('IPC show-in-folder failed:', e);
      }
    }
  };



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

  const triggerSingleDownload = async (
    url: string,
    format: string,
    isAudio: boolean,
    title: string,
    subtitleLang?: string,
    platform: PlatformType = (currentMedia?.platform || 'unknown') as PlatformType,
    customThumbnail?: string
  ) => {
    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }

    const itemThumbnail = customThumbnail || (currentMedia && currentMedia.webpage_url === url ? currentMedia.thumbnail : '') || customThumbnail || '';
    const queueId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const newQueueItem: DownloadQueueItem = {
      id: queueId,
      title,
      url,
      platform,
      format,
      quality: isAudio ? 'MP3 320kbps' : (format.toUpperCase() || 'Best Quality'),
      isAudio,
      progress: 20,
      speed: 'Turbo fragments...',
      eta: '--:--',
      status: 'downloading',
      thumbnail: itemThumbnail,
      outputDir: downloadPath,
      subtitleLang
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
          outputDir: downloadPath,
          subtitleLang
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Download failed');
      }

      const savedFilePath = json.filePath || '';

      setDownloadQueue(prev =>
        prev.map(q => q.id === queueId ? {
          ...q,
          progress: 100,
          status: 'completed',
          speed: 'Saved',
          filePath: savedFilePath
        } : q)
      );

      const newHistoryItem: HistoryItem = {
        id: queueId,
        title,
        url,
        platform,
        type: isAudio ? 'audio' : 'video',
        downloadDate: new Date().toISOString(),
        format: isAudio ? 'MP3' : 'MP4',
        thumbnail: itemThumbnail,
        filePath: savedFilePath
      };

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);

      // Desktop Native Notification
      if ((window as any).require) {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          ipcRenderer.invoke('show-notification', {
            title: 'Download Completed! 🎉',
            body: `${title} has been successfully downloaded.`
          });
        } catch (e) {
          console.warn('Desktop notification error:', e);
        }
      }
    } catch (err: any) {
      console.error('Download execution error:', err);
      setDownloadQueue(prev =>
        prev.map(q => q.id === queueId ? { ...q, status: 'error', errorMessage: err.message || 'Download failed' } : q)
      );
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
      if (!res.ok || !json.items) {
        throw new Error(json.error || 'Batch analysis failed.');
      }

      json.items.forEach((item: any, idx: number) => {
        const url = urls[idx] || item.url;
        if (item.success && item.data) {
          triggerSingleDownload(
            item.data.webpage_url || url,
            'best',
            false,
            item.data.title || `Media Video ${idx + 1}`,
            undefined,
            (item.data.platform || 'unknown') as PlatformType,
            item.data.thumbnail || ''
          );
        } else {
          triggerSingleDownload(
            url,
            'best',
            false,
            `Media Video ${idx + 1}`,
            undefined,
            'unknown',
            ''
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

  const handleBatchPlaylistDownload = (items: PlaylistItem[], isAudio: boolean, format: string) => {
    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }
    items.forEach(item => {
      triggerSingleDownload(
        item.url,
        format,
        isAudio,
        item.title,
        undefined,
        (currentMedia?.platform || 'youtube') as PlatformType,
        item.thumbnail
      );
    });
  };

  const activeDownloads = downloadQueue.filter(i => i.status === 'downloading').length;

  return (
    <div className={`h-screen w-screen bg-[#050505] text-zinc-100 flex flex-col overflow-hidden select-none theme-${activeTheme}`}>
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeDownloadsCount={activeDownloads}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
          {/* Update Banner */}
          {updateInfo?.available && (
            <div className="max-w-5xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-teal-500/20 border border-emerald-500/40 flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0 animate-pulse">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">New Update Available! ({updateInfo.version || 'v1.2.0'})</h4>
                  <p className="text-xs text-emerald-400/80">A new version of Video Pilot Pro is ready. Click below to upgrade automatically.</p>
                </div>
              </div>
              <button
                onClick={() => handleTriggerUpdate(updateInfo.url)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow flex-shrink-0"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{updateInfo.url === 'ready' ? 'Restart & Install' : 'Update Now'}</span>
              </button>
            </div>
          )}

          {/* Floating Clipboard Quick-Action Banner */}
          {clipboardDetectedUrl && (
            <div className="max-w-5xl mx-auto mb-4 p-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 flex items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                  <ClipboardCopy className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-emerald-400">Media link detected in clipboard: </span>
                  <span className="text-xs text-zinc-300 font-mono truncate">{clipboardDetectedUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    handleAnalyzeUrl(clipboardDetectedUrl);
                    setClipboardDetectedUrl(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow"
                >
                  Paste & Analyze
                </button>
                <button
                  onClick={() => {
                    setDismissedClipboardUrl(clipboardDetectedUrl);
                    setClipboardDetectedUrl(null);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

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
                <div className="flex items-center gap-3">
                  <button
                    onClick={checkVersionRealtime}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>Check Updates</span>
                  </button>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-emerald-400 border border-zinc-700">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Engine v{CURRENT_VERSION}</span>
                  </div>
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
                    <VideoPreviewCard
                      media={currentMedia}
                      onDownload={triggerSingleDownload}
                    />
                  )}
                </>
              )}

              <ProgressQueue
                queue={downloadQueue}
                onClearCompleted={() => setDownloadQueue(prev => prev.filter(i => i.status !== 'completed'))}
                onOpenFile={handleOpenFile}
                onShowInFolder={handleShowInFolder}
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
              onOpenFile={handleOpenFile}
              onShowInFolder={handleShowInFolder}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              downloadPath={downloadPath}
              onChangePath={handleSelectFolder}
              currentVersion={CURRENT_VERSION}
              onCheckUpdate={checkVersionRealtime}
              updateStatus={updateStatus}
              onDownloadUpdate={handleTriggerUpdate}
              activeTheme={activeTheme}
              onSelectTheme={setActiveTheme}
            />
          )}
        </main>
      </div>



      <StatusBar downloadPath={downloadPath || 'Not Configured (Set in Settings)'} activeCount={activeDownloads} />
    </div>
  );
}

export default App;
