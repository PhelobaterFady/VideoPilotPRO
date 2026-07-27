export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'unknown';

export interface FormatOption {
  formatId: string;
  label: string;
  ext: string;
  quality: string;
  isVideo: boolean;
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  uploader: string;
  thumbnail: string;
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
  status: 'queued' | 'downloading' | 'completed' | 'error';
  errorMessage?: string;
  downloadUrl?: string;
  thumbnail?: string;
  outputDir?: string;
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
}
