export interface DownloadRequest {
  url: string;
  format?: string;
  quality?: string;
}

export interface DownloadResponse {
  id: string;
  status: 'queued' | 'extracting' | 'downloading' | 'completed' | 'failed';
  title?: string;
  thumbnail?: string;
  platform?: string;
  progress: number;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
  fileName?: string;
}

export interface MediaInfo {
  id: string;
  title: string;
  thumbnail?: string;
  platform: string;
  duration?: number;
  formats: FormatOption[];
}

export interface FormatOption {
  formatId: string;
  extension: string;
  quality?: string;
  fileSize?: number;
  resolution?: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
}
