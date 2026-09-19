export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'unknown';

export interface FormatOption {
  formatId: string;
  label: string;
  ext: string;
  quality: string;
  fps?: number;
  isVideo: boolean;
  filesize?: number;
  filesizeFormatted?: string;
}

export interface SubtitleOption {
  code: string;
  name: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  uploader: string;
  thumbnail: string;
  isShort?: boolean;
}

export interface MediaInfo {
  type: 'video' | 'short' | 'playlist';
  platform: PlatformType;
  id: string;
  title: string;
  description?: string;
  uploader: string;
  duration?: number;
  thumbnail: string;
  webpage_url?: string;
  formats?: FormatOption[];
  subtitles?: SubtitleOption[];
  itemCount?: number;
  items?: PlaylistItem[];
}

export interface DownloadQueueItem {
  id: string;
  title: string;
  url: string;
  platform: PlatformType;
  format: string;
  quality: string;
  isAudio: boolean;
  progress: number;
  speed?: string | null;
  eta?: string | null;
  status: 'queued' | 'downloading' | 'paused' | 'cancelled' | 'completed' | 'error';
  errorMessage?: string;
  downloadUrl?: string;
  thumbnail?: string;
  outputDir?: string;
  filePath?: string;
  subtitleLang?: string;
  limitRate?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  platform: PlatformType;
  type: string;
  downloadDate: string;
  format: string;
  thumbnail: string;
  filePath?: string;
}
