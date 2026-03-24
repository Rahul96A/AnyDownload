import { Component, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DownloadService } from '../../services/download.service';
import { DownloadResponse } from '../../models/download.model';

@Component({
  selector: 'app-download-list',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (allDownloads().length > 0) {
      <div class="download-list">
        <h2>Downloads</h2>
        @for (download of allDownloads(); track download.id) {
          <div class="download-card" [class]="download.status">
            <div class="card-header">
              <div class="platform-indicator" [style.background-color]="downloadService.getPlatformColor(download.platform || 'unknown')">
                {{ downloadService.getPlatformName(download.platform || 'unknown') }}
              </div>
              <span class="status-badge" [class]="download.status">{{ download.status }}</span>
            </div>

            <div class="card-body">
              <div class="title">{{ download.title || 'Fetching...' }}</div>

              @if (download.status === 'downloading' || download.status === 'extracting') {
                <div class="progress-bar-container">
                  <div class="progress-bar" [style.width.%]="download.progress"></div>
                </div>
                <div class="progress-text">{{ download.progress | number:'1.0-1' }}%</div>
              }

              @if (download.status === 'completed') {
                <div class="completed-actions">
                  @if (download.fileSize) {
                    <span class="file-size">{{ formatSize(download.fileSize) }}</span>
                  }
                  <a
                    class="btn-save"
                    [href]="downloadService.getFileUrl(download.id)"
                    download
                  >
                    Save File
                  </a>
                </div>
              }

              @if (download.status === 'failed') {
                <div class="error">{{ download.error }}</div>
              }
            </div>

            @if (download.status !== 'completed' && download.status !== 'failed') {
              <button class="btn-cancel" (click)="cancel(download.id)">Cancel</button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .download-list {
      width: 100%;
      max-width: 700px;
      margin: 32px auto 0;
    }

    h2 {
      color: #cdd6f4;
      font-size: 1.1rem;
      margin-bottom: 16px;
    }

    .download-card {
      background: #1e1e2e;
      border: 1px solid #313244;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      transition: border-color 0.2s;
    }

    .download-card.downloading {
      border-color: #6366f1;
    }

    .download-card.completed {
      border-color: #a6e3a1;
    }

    .download-card.failed {
      border-color: #f38ba8;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .platform-indicator {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-badge.queued { color: #a6adc8; }
    .status-badge.extracting { color: #fab387; }
    .status-badge.downloading { color: #6366f1; }
    .status-badge.completed { color: #a6e3a1; }
    .status-badge.failed { color: #f38ba8; }

    .title {
      color: #cdd6f4;
      font-size: 0.95rem;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-bar-container {
      height: 6px;
      background: #313244;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #818cf8);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.8rem;
      color: #a6adc8;
      text-align: right;
    }

    .completed-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .file-size {
      color: #a6adc8;
      font-size: 0.85rem;
    }

    .btn-save {
      background: #a6e3a1;
      color: #1e1e2e;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }

    .btn-save:hover {
      background: #94e2d5;
    }

    .error {
      color: #f38ba8;
      font-size: 0.85rem;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid #f38ba8;
      color: #f38ba8;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #f38ba8;
      color: #1e1e2e;
    }
  `]
})
export class DownloadListComponent {
  allDownloads = computed(() => {
    const map = this.downloadService.downloads();
    return [...map.values()].sort((a, b) => {
      const order: Record<string, number> = { downloading: 0, extracting: 1, queued: 2, completed: 3, failed: 4 };
      return (order[a.status] ?? 5) - (order[b.status] ?? 5);
    });
  });

  constructor(public downloadService: DownloadService) {}

  cancel(id: string): void {
    this.downloadService.cancelDownload(id);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}
