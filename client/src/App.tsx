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
import { ConvertersView } from './components/ConvertersView';
import { SettingsView } from './components/SettingsView';
import type { ThemeType, StorageSortMode } from './components/SettingsView';
import { ToastContainer } from './components/Toast';
import type { ToastItem } from './components/Toast';
import { QrShareModal } from './components/QrShareModal';
import { TranscriptModal } from './components/TranscriptModal';
import { MediaCompressorModal } from './components/MediaCompressorModal';
import type { MediaInfo, DownloadQueueItem, HistoryItem, PlaylistItem, PlatformType } from './types';
import { Sparkles, AlertTriangle, ArrowRight, Folder, RefreshCw, DownloadCloud, ClipboardCopy, X, UploadCloud } from 'lucide-react';

const APP_SECRET = 'VP_PRO_APP_SECRET_2026';
const CURRENT_VERSION = '1.3.1';
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

  // In-App Modern Glassmorphic Toast System
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (type: ToastItem['type'], message: string, title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev.slice(-3), { id, type, message, title }]);
  };
  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Drag & Drop Link State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('videopilot_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      localStorage.setItem('videopilot_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };



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

  const [speedLimit, setSpeedLimit] = useState<string>(() => {
    return localStorage.getItem('videopilot_speed_limit') || 'unlimited';
  });

  useEffect(() => {
    localStorage.setItem('videopilot_speed_limit', speedLimit);
  }, [speedLimit]);

  // Smart Storage Sorter Mode
  const [sortMode, setSortMode] = useState<StorageSortMode>(() => {
    return (localStorage.getItem('videopilot_sort_mode') as StorageSortMode) || 'flat';
  });
  useEffect(() => {
    localStorage.setItem('videopilot_sort_mode', sortMode);
  }, [sortMode]);

  // Turbo Multi-Threading Streams (4, 8, 16)
  const [turboStreams, setTurboStreams] = useState<number>(() => {
    const s = localStorage.getItem('videopilot_turbo_streams');
    return s ? parseInt(s, 10) : 16;
  });
  useEffect(() => {
    localStorage.setItem('videopilot_turbo_streams', String(turboStreams));
  }, [turboStreams]);

  // Auto-ID3 Metadata & Album Art Embedder
  const [embedMetadata, setEmbedMetadata] = useState<boolean>(() => {
    return localStorage.getItem('videopilot_embed_metadata') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('videopilot_embed_metadata', String(embedMetadata));
  }, [embedMetadata]);

  // Browser Cookies & Session Authenticator
  const [cookieSourceType, setCookieSourceType] = useState<'none' | 'browser' | 'file'>(() => {
    return (localStorage.getItem('videopilot_cookie_type') as 'none' | 'browser' | 'file') || 'none';
  });
  useEffect(() => {
    localStorage.setItem('videopilot_cookie_type', cookieSourceType);
  }, [cookieSourceType]);

  const [cookieBrowser, setCookieBrowser] = useState<string>(() => {
    return localStorage.getItem('videopilot_cookie_browser') || 'edge';
  });
  useEffect(() => {
    localStorage.setItem('videopilot_cookie_browser', cookieBrowser);
  }, [cookieBrowser]);

  const [cookieFilePath, setCookieFilePath] = useState<string>(() => {
    return localStorage.getItem('videopilot_cookie_file') || '';
  });
  useEffect(() => {
    localStorage.setItem('videopilot_cookie_file', cookieFilePath);
  }, [cookieFilePath]);

  const getActiveCookieParams = () => {
    if (cookieSourceType === 'browser') {
      return { cookiesFromBrowser: cookieBrowser, cookiesFile: null };
    }
    if (cookieSourceType === 'file' && cookieFilePath) {
      return { cookiesFromBrowser: 'none', cookiesFile: cookieFilePath };
    }
    return { cookiesFromBrowser: 'none', cookiesFile: null };
  };

  const handleSelectCookieFile = async () => {
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const selected = await ipcRenderer.invoke('select-cookie-file');
        if (selected) {
          setCookieFilePath(selected);
          setCookieSourceType('file');
          addToast('success', `Active: ${selected.split(/[\\/]/).pop()}`, 'Cookies File Loaded');
          return;
        }
      } catch (e) {
        console.warn('IPC select-cookie-file error:', e);
      }
    }
    const manual = prompt('Enter full path to Netscape cookies.txt file:', cookieFilePath || 'C:\\Downloads\\cookies.txt');
    if (manual) {
      setCookieFilePath(manual);
      setCookieSourceType('file');
      addToast('success', 'Cookies file path registered', 'Cookies Active');
    }
  };

  const handleTestCookies = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    const params = getActiveCookieParams();
    const res = await fetch(`${API_BASE_URL}/api/tools/test-cookies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': APP_SECRET
      },
      body: JSON.stringify({
        browser: params.cookiesFromBrowser,
        filePath: params.cookiesFile
      })
    });
    return await res.json();
  };

  const handleSaveCookieContent = async (content: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    const res = await fetch(`${API_BASE_URL}/api/tools/save-cookie-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': APP_SECRET
      },
      body: JSON.stringify({ content })
    });
    const json = await res.json();
    if (json.success && json.filePath) {
      setCookieFilePath(json.filePath);
      setCookieSourceType('file');
      addToast('success', 'cookies.txt saved and activated!', 'Session Activated');
    }
    return json;
  };

  // Media Compressor Modal State
  const [compressModalData, setCompressModalData] = useState<{
    isOpen: boolean;
    filePath: string;
    fileName: string;
  }>({
    isOpen: false,
    filePath: '',
    fileName: ''
  });

  const handleOpenCompress = (filePath: string, fileName: string) => {
    setCompressModalData({
      isOpen: true,
      filePath,
      fileName
    });
  };

  // QR Share Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    qrDataUrl: string;
    transferUrl: string;
    fileName: string;
    localIp: string;
  }>({
    isOpen: false,
    qrDataUrl: '',
    transferUrl: '',
    fileName: '',
    localIp: ''
  });

  // Transcript Modal State
  const [transcriptModalData, setTranscriptModalData] = useState<{
    isOpen: boolean;
    media: MediaInfo | null;
  }>({
    isOpen: false,
    media: null
  });

  // Wi-Fi QR Transfer to Mobile
  const handleSendToPhone = async (filePath: string, title: string) => {
    try {
      addToast('info', 'Generating mobile transfer QR Code...', 'Local Wi-Fi Transfer');
      const res = await fetch(`${API_BASE_URL}/api/transfer/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ filePath, title })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate QR');

      setQrModalData({
        isOpen: true,
        qrDataUrl: json.qrDataUrl,
        transferUrl: json.transferUrl,
        fileName: json.fileName,
        localIp: json.localIp
      });
      addToast('success', 'QR Code ready! Scan with your mobile camera to download via Wi-Fi.', 'Transfer Link Generated');
    } catch (err: any) {
      addToast('error', err.message || 'Could not start mobile transfer', 'Transfer Error');
    }
  };

  // Ultra HD Thumbnail/Poster Saver
  const handleSavePoster = async (thumbnailUrl: string, title: string) => {
    if (!downloadPath || downloadPath.trim() === '') {
      addToast('error', 'Please configure your download folder in Settings first!', 'Save Location Missing');
      return;
    }
    try {
      addToast('info', 'Downloading Ultra HD Poster image...', 'Poster Download');
      const res = await fetch(`${API_BASE_URL}/api/save-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ thumbnailUrl, title, outputDir: downloadPath })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save poster');
      addToast('success', `Saved HD Poster to: ${json.filePath}`, 'Poster Saved');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save poster', 'Poster Error');
    }
  };

  // Lossless Photographic Frame Grabber
  const handleSnapFrame = async (timestamp: string = '00:00:05', title?: string) => {
    if (!downloadPath || downloadPath.trim() === '') {
      addToast('error', 'Please configure your download folder in Settings & Storage first!', 'Save Location Missing');
      return;
    }
    try {
      addToast('info', `Snapping lossless PNG frame at ${timestamp}...`, 'Frame Grabber');
      const targetSource = currentMedia?.webpage_url || currentMedia?.id || '';
      const res = await fetch(`${API_BASE_URL}/api/tools/frame-grab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({
          source: targetSource,
          timestamp,
          outputDir: downloadPath,
          title: title || currentMedia?.title || 'Frame',
          ...getActiveCookieParams()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to capture frame');
      addToast('success', `Saved lossless frame: ${json.fileName}`, 'Frame Captured 📸');
    } catch (err: any) {
      addToast('error', err.message || 'Frame grab failed', 'Capture Error');
    }
  };

  // Save Transcript as TXT or SRT file
  const handleSaveTranscript = async (title: string, content: string, format: 'txt' | 'srt') => {
    if (!downloadPath || downloadPath.trim() === '') {
      addToast('error', 'Please configure your download folder in Settings first!', 'Save Location Missing');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/save-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ title, content, format, outputDir: downloadPath })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save transcript');
      addToast('success', `Saved transcript as .${format.toUpperCase()} to downloads folder!`, 'Transcript Saved');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save transcript', 'Save Error');
    }
  };

  const handleOpenTranscript = (media: MediaInfo) => {
    setTranscriptModalData({ isOpen: true, media });
  };

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
          const ver = info?.version || '1.3.1';
          setUpdateInfo({ available: true, version: ver });
          setUpdateStatus({
            checked: true,
            isLatest: false,
            latestVersion: ver,
            downloadUrl: 'https://github.com/PhelobaterFady/VideoPilotPRO/releases/latest'
          });
        });

        ipcRenderer.on('update-ready', (_: any, info: any) => {
          const ver = info?.version || '1.3.1';
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

  // Real-time SSE listener for yt-dlp percentage, speed, and ETA
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/download/progress-stream`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || !data.id) return;

          setDownloadQueue(prev =>
            prev.map(item => {
              if (item.id !== data.id) return item;

              const updated: DownloadQueueItem = { ...item };
              if (typeof data.percent === 'number') {
                updated.progress = data.percent;
              }
              if (data.speed !== undefined) {
                updated.speed = data.speed;
              }
              if (data.eta !== undefined) {
                updated.eta = data.eta;
              }
              if (data.status && data.status !== updated.status) {
                updated.status = data.status;
              }
              return updated;
            })
          );
        } catch (e) {}
      };
    } catch (err) {
      console.warn('SSE connection failed:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);



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
        body: JSON.stringify({
          url,
          ...getActiveCookieParams()
        })
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

  interface DownloadTriggerOptions {
    url: string;
    format: string;
    isAudio: boolean;
    title: string;
    subtitleLang?: string;
    clipStart?: string;
    clipEnd?: string;
    platform?: PlatformType;
    customThumbnail?: string;
    audioBoost?: string;
    playbackSpeed?: number;
    uploader?: string;
  }

  const triggerSingleDownload = async (
    urlOrOptions: string | DownloadTriggerOptions,
    formatArg?: string,
    isAudioArg?: boolean,
    titleArg?: string,
    subtitleLangArg?: string,
    clipStartArg?: string,
    clipEndArg?: string,
    platformArg?: PlatformType,
    customThumbnailArg?: string
  ) => {
    let url: string = '';
    let format: string = 'best';
    let isAudio: boolean = false;
    let title: string = 'Media Video';
    let subtitleLang: string | undefined = undefined;
    let clipStart: string | undefined = undefined;
    let clipEnd: string | undefined = undefined;
    let platform: PlatformType = 'unknown';
    let customThumbnail: string | undefined = undefined;
    let audioBoost: string | undefined = undefined;
    let playbackSpeed: number | undefined = undefined;
    let uploader: string | undefined = undefined;

    if (typeof urlOrOptions === 'object' && urlOrOptions !== null) {
      const opts = urlOrOptions as DownloadTriggerOptions;
      url = opts.url || '';
      format = opts.format || 'best';
      isAudio = !!opts.isAudio;
      title = opts.title || 'Media Video';
      subtitleLang = opts.subtitleLang;
      clipStart = opts.clipStart;
      clipEnd = opts.clipEnd;
      platform = opts.platform || ((currentMedia?.platform || 'unknown') as PlatformType);
      customThumbnail = opts.customThumbnail;
      audioBoost = opts.audioBoost;
      playbackSpeed = opts.playbackSpeed;
      uploader = opts.uploader || currentMedia?.uploader || '';
    } else {
      url = typeof urlOrOptions === 'string' ? urlOrOptions : (urlOrOptions as any)?.url || '';
      format = formatArg || 'best';
      isAudio = !!isAudioArg;
      title = titleArg || 'Media Video';
      subtitleLang = subtitleLangArg;
      clipStart = clipStartArg;
      clipEnd = clipEndArg;
      platform = platformArg || ((currentMedia?.platform || 'unknown') as PlatformType);
      customThumbnail = customThumbnailArg;
      uploader = currentMedia?.uploader || '';
    }

    if (!downloadPath || downloadPath.trim() === '') {
      setErrorMessage('⚠️ Save location is not set! Please configure your download folder in Settings & Storage first.');
      return;
    }

    const itemThumbnail = customThumbnail || (currentMedia && currentMedia.webpage_url === url ? currentMedia.thumbnail : '') || '';
    const queueId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const isClipped = !!((clipStart && clipStart.trim() !== '') || (clipEnd && clipEnd.trim() !== ''));
    let displayQuality = isClipped
      ? `Clip [${clipStart || '0'} -> ${clipEnd || 'End'}] (${isAudio ? 'MP3' : (format.toUpperCase() || 'Best')})`
      : (isAudio ? 'MP3 320kbps' : (format.toUpperCase() || 'Best Quality'));

    if (playbackSpeed && playbackSpeed !== 1.0) {
      displayQuality += ` • ${playbackSpeed}x Speed`;
    }
    if (audioBoost && audioBoost !== 'none') {
      displayQuality += ` • [${audioBoost}]`;
    }

    const newQueueItem: DownloadQueueItem = {
      id: queueId,
      title: isClipped ? `[Clip] ${title}` : title,
      url,
      platform,
      format,
      quality: displayQuality,
      isAudio,
      progress: 5,
      speed: 'Connecting...',
      eta: '--:--',
      status: 'downloading',
      thumbnail: itemThumbnail,
      outputDir: downloadPath,
      subtitleLang,
      limitRate: speedLimit
    };

    setDownloadQueue(prev => [newQueueItem, ...prev]);
    addToast('info', `Added "${title.slice(0, 35)}..." to queue`, 'Download Started');

    try {
      const res = await fetch(`${API_BASE_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({
          id: queueId,
          url,
          format,
          audioOnly: isAudio,
          title: isClipped ? `[Clip] ${title}` : title,
          outputDir: downloadPath,
          subtitleLang,
          limitRate: speedLimit,
          clipStart,
          clipEnd,
          sortMode,
          turboStreams,
          embedMetadata,
          audioBoost: audioBoost || 'none',
          playbackSpeed: playbackSpeed || 1.0,
          uploader: uploader || '',
          ...getActiveCookieParams()
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Download failed');
      }

      if (json.status === 'paused' || json.status === 'cancelled') {
        return;
      }

      if (!json.success) {
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
      addToast('success', `${title.slice(0, 35)}... saved on your PC!`, 'Download Complete 🎉');

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
        prev.map(q => q.id === queueId && q.status === 'downloading' ? { ...q, status: 'error', errorMessage: err.message || 'Download failed' } : q)
      );
    }
  };

  const handlePauseDownload = async (id: string) => {
    try {
      setDownloadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, status: 'paused', speed: 'Paused' } : q)
      );
      await fetch(`${API_BASE_URL}/api/download/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.warn('Failed to pause download:', e);
    }
  };

  const handleResumeDownload = async (id: string) => {
    try {
      const item = downloadQueue.find(q => q.id === id);
      if (!item) return;

      setDownloadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, status: 'downloading', speed: 'Resuming...' } : q)
      );

      const res = await fetch(`${API_BASE_URL}/api/download/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ id })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const savedFilePath = json.filePath || '';
        setDownloadQueue(prev =>
          prev.map(q => q.id === id ? {
            ...q,
            progress: 100,
            status: 'completed',
            speed: 'Saved',
            filePath: savedFilePath
          } : q)
        );

        const newHistoryItem: HistoryItem = {
          id,
          title: item.title,
          url: item.url,
          platform: item.platform,
          type: item.isAudio ? 'audio' : 'video',
          downloadDate: new Date().toISOString(),
          format: item.isAudio ? 'MP3' : 'MP4',
          thumbnail: item.thumbnail || '',
          filePath: savedFilePath
        };
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
      }
    } catch (e) {
      console.warn('Failed to resume download:', e);
    }
  };

  const handleCancelDownload = async (id: string) => {
    try {
      setDownloadQueue(prev =>
        prev.map(q => q.id === id ? { ...q, status: 'cancelled', speed: 'Cancelled' } : q)
      );
      await fetch(`${API_BASE_URL}/api/download/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': APP_SECRET
        },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      console.warn('Failed to cancel download:', e);
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
          triggerSingleDownload({
            url: item.data.webpage_url || url,
            format: 'best',
            isAudio: false,
            title: item.data.title || `Media Video ${idx + 1}`,
            platform: (item.data.platform || 'unknown') as PlatformType,
            customThumbnail: item.data.thumbnail || ''
          });
        } else {
          triggerSingleDownload({
            url,
            format: 'best',
            isAudio: false,
            title: `Media Video ${idx + 1}`,
            platform: 'unknown',
            customThumbnail: ''
          });
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
      triggerSingleDownload({
        url: item.url,
        format,
        isAudio,
        title: item.title,
        platform: (currentMedia?.platform || 'youtube') as PlatformType,
        customThumbnail: item.thumbnail
      });
    });
  };

  const activeDownloads = downloadQueue.filter(i => i.status === 'downloading').length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (droppedText && (droppedText.startsWith('http://') || droppedText.startsWith('https://'))) {
      setActiveTab('downloader');
      addToast('info', `Analyzing: ${droppedText.slice(0, 40)}...`, 'Link Dropped');
      handleAnalyzeUrl(droppedText.trim());
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-screen w-screen bg-[#07090e] text-[rgba(240,244,248,0.92)] flex flex-col overflow-hidden select-none theme-${activeTheme} relative font-sans`}
    >
      <TitleBar />

      {/* Drag & Drop Aerospace Master Deck Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#07090e]/90 backdrop-blur-2xl border-4 border-dashed border-[#00e5ff]/80 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-2xl bg-[rgba(0,229,255,0.15)] text-[#00e5ff] flex items-center justify-center border border-[rgba(0,229,255,0.4)] shadow-[0_0_40px_rgba(0,229,255,0.35)] animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-bold font-display text-white tracking-tight">Drop Media Stream to Ingest 🚀</h3>
            <p className="text-xs text-[#00e5ff] font-mono">Release the media URL to trigger instant extraction & analysis</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeDownloadsCount={activeDownloads}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto px-6 md:px-10 py-6 bg-[#07090e] custom-aerospace-scrollbar">
          {/* Update Banner */}
          {updateInfo?.available && (
            <div className="w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-[rgba(0,229,255,0.12)] via-[rgba(0,230,118,0.08)] to-transparent border border-[rgba(0,229,255,0.3)] flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,229,255,0.08)]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(0,229,255,0.15)] text-[#00e5ff] flex items-center justify-center border border-[rgba(0,229,255,0.3)] flex-shrink-0 animate-pulse">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-white">New Core Firmware Available ({updateInfo.version || 'v1.3.1'})</h4>
                  <p className="text-xs text-[rgba(240,244,248,0.6)] font-mono">A new optimized extraction core is ready. Update now to ensure full protocol compatibility.</p>
                </div>
              </div>
              <button
                onClick={() => handleTriggerUpdate(updateInfo.url)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] text-[#07090e] transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)] flex-shrink-0 cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{updateInfo.url === 'ready' ? 'Restart & Deploy' : 'Deploy Update'}</span>
              </button>
            </div>
          )}

          {/* Floating Clipboard Quick-Action Bay */}
          {clipboardDetectedUrl && (
            <div className="w-full mb-5 p-3 rounded-xl bg-[rgba(14,19,31,0.85)] border border-[rgba(0,229,255,0.35)] flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,229,255,0.1)] backdrop-blur-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[rgba(0,229,255,0.12)] text-[#00e5ff] flex items-center justify-center border border-[rgba(0,229,255,0.25)] flex-shrink-0">
                  <ClipboardCopy className="w-4 h-4" />
                </div>
                <div className="truncate font-mono">
                  <span className="text-[11px] font-semibold text-[#00e5ff] uppercase tracking-wider mr-2">Link Detected:</span>
                  <span className="text-xs text-zinc-300 truncate">{clipboardDetectedUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    handleAnalyzeUrl(clipboardDetectedUrl);
                    setClipboardDetectedUrl(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#00e5ff] to-[#00b0ff] text-[#07090e] transition-all shadow-[0_0_12px_rgba(0,229,255,0.25)] cursor-pointer"
                >
                  Inspect & Ingest
                </button>
                <button
                  onClick={() => {
                    setDismissedClipboardUrl(clipboardDetectedUrl);
                    setClipboardDetectedUrl(null);
                  }}
                  className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-zinc-400 hover:text-white transition-all cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {(!downloadPath || downloadPath.trim() === '') && (
            <div className="w-full mb-6 p-4 rounded-xl bg-[rgba(255,176,32,0.08)] border border-[rgba(255,176,32,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,176,32,0.15)] text-[#ffb020] flex items-center justify-center border border-[rgba(255,176,32,0.3)] flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-[#ffb020]">Storage Vault Not Calibrated</h4>
                  <p className="text-xs text-[rgba(240,244,248,0.6)] font-mono">Select a destination folder on your workstation before starting downloads.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#ffb020] hover:bg-[#ffc107] text-[#07090e] transition-all shadow-[0_0_15px_rgba(255,176,32,0.25)] flex-shrink-0 cursor-pointer"
              >
                <Folder className="w-4 h-4" />
                <span>Configure Storage Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tab Content with Smooth Transitions */}
          {activeTab === 'downloader' && (
            <div className="w-full space-y-6 tab-content-enter">
              <div className="flex items-center justify-between cockpit-card p-4 rounded-xl border border-[rgba(255,255,255,0.06)]">
                <div>
                  <h2 className="text-lg font-bold font-display text-white tracking-tight">Direct Stream Ingestion Bay</h2>
                  <p className="text-xs text-[rgba(240,244,248,0.5)]">Feed media URLs from YouTube, TikTok, Instagram, Facebook, Vimeo, or X</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={checkVersionRealtime}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#00e5ff] border border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-[#00e5ff]" />
                    <span>Ping Core</span>
                  </button>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-[rgba(0,230,118,0.08)] text-[#00e676] border border-[rgba(0,230,118,0.2)]">
                    <Sparkles className="w-3.5 h-3.5 text-[#00e676]" />
                    <span>CORE v{CURRENT_VERSION}</span>
                  </div>
                </div>
              </div>

              <UrlInput onAnalyze={handleAnalyzeUrl} isLoading={isLoading} />

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-[rgba(255,82,82,0.1)] border border-[rgba(255,82,82,0.3)] text-[#ff5252] text-xs font-mono flex items-center justify-between gap-4">
                  <span>{errorMessage}</span>
                  {(!downloadPath || downloadPath.trim() === '') && (
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-3 py-1 rounded-md bg-[#ff5252] text-[#07090e] font-bold text-xs cursor-pointer"
                    >
                      Calibrate Vault
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
                      onOpenTranscript={handleOpenTranscript}
                      onSavePoster={handleSavePoster}
                      onSnapFrame={handleSnapFrame}
                    />
                  )}
                </>
              )}

              <ProgressQueue
                queue={downloadQueue}
                onClearCompleted={() => setDownloadQueue(prev => prev.filter(i => i.status !== 'completed'))}
                onOpenFile={handleOpenFile}
                onShowInFolder={handleShowInFolder}
                onPauseDownload={handlePauseDownload}
                onResumeDownload={handleResumeDownload}
                onCancelDownload={handleCancelDownload}
                onSendToPhone={handleSendToPhone}
                onCompressVideo={handleOpenCompress}
              />
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="tab-content-enter">
              <BatchDownloader
                onAnalyzeBatch={handleAnalyzeBatch}
                isLoading={isLoading}
                onClose={() => setActiveTab('downloader')}
              />
            </div>
          )}

          {activeTab === 'converters' && (
            <div className="tab-content-enter">
              <ConvertersView
                apiBaseUrl={API_BASE_URL}
                appSecret={APP_SECRET}
                downloadPath={downloadPath}
                historyItems={history}
                onOpenFile={handleOpenFile}
                onShowInFolder={handleShowInFolder}
                onSendToPhone={handleSendToPhone}
                onPlayVideo={(filePath) => {
                  if (handleOpenFile) handleOpenFile(filePath);
                }}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="tab-content-enter">
              <HistoryView
                history={history}
                onClearHistory={() => setHistory([])}
                onOpenFile={handleOpenFile}
                onShowInFolder={handleShowInFolder}
                onDeleteItem={(id) => {
                  setHistory(prev => prev.filter(i => i.id !== id));
                  addToast('info', 'Item removed from download history');
                }}
                onSendToPhone={handleSendToPhone}
                onCompressVideo={handleOpenCompress}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content-enter">
              <SettingsView
                downloadPath={downloadPath}
                onChangePath={handleSelectFolder}
                currentVersion={CURRENT_VERSION}
                onCheckUpdate={checkVersionRealtime}
                updateStatus={updateStatus}
                onDownloadUpdate={handleTriggerUpdate}
                activeTheme={activeTheme}
                onSelectTheme={setActiveTheme}
                speedLimit={speedLimit}
                onChangeSpeedLimit={(lim) => {
                  setSpeedLimit(lim);
                  addToast('speed', `Speed limit updated to: ${lim === 'unlimited' ? 'Maximum Speed' : lim}`, 'Bandwidth Updated');
                }}
                sortMode={sortMode}
                onChangeSortMode={setSortMode}
                turboStreams={turboStreams}
                onChangeTurboStreams={setTurboStreams}
                embedMetadata={embedMetadata}
                onChangeEmbedMetadata={setEmbedMetadata}
                cookieSourceType={cookieSourceType}
                onChangeCookieSourceType={setCookieSourceType}
                cookieBrowser={cookieBrowser}
                onChangeCookieBrowser={setCookieBrowser}
                cookieFilePath={cookieFilePath}
                onSelectCookieFile={handleSelectCookieFile}
                onTestCookies={handleTestCookies}
                onSaveCookieContent={handleSaveCookieContent}
              />
            </div>
          )}
        </main>
      </div>

      {/* QR Code Wi-Fi Mobile Share Modal */}
      <QrShareModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData(prev => ({ ...prev, isOpen: false }))}
        qrDataUrl={qrModalData.qrDataUrl}
        transferUrl={qrModalData.transferUrl}
        fileName={qrModalData.fileName}
        localIp={qrModalData.localIp}
      />

      {/* Transcript & Subtitles Modal */}
      {transcriptModalData.isOpen && transcriptModalData.media && (
        <TranscriptModal
          isOpen={transcriptModalData.isOpen}
          onClose={() => setTranscriptModalData({ isOpen: false, media: null })}
          videoTitle={transcriptModalData.media.title}
          videoUrl={transcriptModalData.media.webpage_url || transcriptModalData.media.id}
          availableSubtitles={transcriptModalData.media.subtitles}
          onSaveTranscript={handleSaveTranscript}
          apiBaseUrl={API_BASE_URL}
          appSecret={APP_SECRET}
        />
      )}

      {/* Smart Social Media Compressor Modal */}
      <MediaCompressorModal
        isOpen={compressModalData.isOpen}
        onClose={() => setCompressModalData(prev => ({ ...prev, isOpen: false }))}
        filePath={compressModalData.filePath}
        fileName={compressModalData.fileName}
        apiBaseUrl={API_BASE_URL}
        appSecret={APP_SECRET}
        onOpenFile={handleOpenFile}
        onShowInFolder={handleShowInFolder}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <StatusBar downloadPath={downloadPath || 'Not Configured (Set in Settings)'} activeCount={activeDownloads} version={CURRENT_VERSION} />
    </div>
  );
}

export default App;
