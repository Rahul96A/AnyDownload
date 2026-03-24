import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DownloadRequest, DownloadResponse, MediaInfo, Platform } from '../models/download.model';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private hubConnection: signalR.HubConnection | null = null;

  // Signals for reactive state
  readonly downloads = signal<Map<string, DownloadResponse>>(new Map());
  readonly activeDownloads = computed(() => {
    const map = this.downloads();
    return [...map.values()].filter(d => d.status !== 'completed' && d.status !== 'failed');
  });
  readonly completedDownloads = computed(() => {
    const map = this.downloads();
    return [...map.values()].filter(d => d.status === 'completed');
  });

  constructor(private http: HttpClient) {
    this.initSignalR();
  }

  private initSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('DownloadProgress', (response: DownloadResponse) => {
      this.downloads.update(map => {
        const newMap = new Map(map);
        newMap.set(response.id, response);
        return newMap;
      });
    });

    this.hubConnection.start().catch(err => console.error('SignalR connection error:', err));
  }

  async getMediaInfo(url: string): Promise<MediaInfo> {
    return this.http.post<MediaInfo>(`${environment.apiUrl}/download/info`, { url }).toPromise() as Promise<MediaInfo>;
  }

  async startDownload(request: DownloadRequest): Promise<DownloadResponse> {
    const response = await this.http.post<DownloadResponse>(`${environment.apiUrl}/download/start`, request).toPromise() as DownloadResponse;

    // Join SignalR group for this download
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinDownload', response.id);
    }

    this.downloads.update(map => {
      const newMap = new Map(map);
      newMap.set(response.id, response);
      return newMap;
    });

    return response;
  }

  async cancelDownload(id: string): Promise<void> {
    await this.http.delete(`${environment.apiUrl}/download/${id}`).toPromise();
    this.downloads.update(map => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  getFileUrl(id: string): string {
    return `${environment.apiUrl}/download/${id}/file`;
  }

  async getPlatforms(): Promise<Platform[]> {
    return this.http.get<Platform[]>(`${environment.apiUrl}/download/platforms`).toPromise() as Promise<Platform[]>;
  }

  detectPlatform(url: string): string {
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
      if (host.includes('instagram.com')) return 'instagram';
      if (host.includes('twitter.com') || host.includes('x.com')) return 'x';
      if (host.includes('linkedin.com')) return 'linkedin';
      if (host.includes('tiktok.com')) return 'tiktok';
      if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
      if (host.includes('reddit.com')) return 'reddit';
      if (host.includes('vimeo.com')) return 'vimeo';
    } catch {}
    return 'unknown';
  }

  getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      youtube: '#FF0000',
      instagram: '#E4405F',
      x: '#000000',
      linkedin: '#0A66C2',
      tiktok: '#000000',
      facebook: '#1877F2',
      reddit: '#FF4500',
      vimeo: '#1AB7EA',
    };
    return colors[platform] || '#6366f1';
  }

  getPlatformName(platform: string): string {
    const names: Record<string, string> = {
      youtube: 'YouTube',
      instagram: 'Instagram',
      x: 'X (Twitter)',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      facebook: 'Facebook',
      reddit: 'Reddit',
      vimeo: 'Vimeo',
    };
    return names[platform] || 'Unknown';
  }
}
