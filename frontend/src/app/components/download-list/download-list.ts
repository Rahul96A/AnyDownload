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
        <div class="list-header">
          <h2>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v10m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="16" x2="14" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Downloads
          </h2>
          <span class="count-badge">{{ allDownloads().length }}</span>
        </div>

        @for (download of allDownloads(); track download.id) {
          <div class="dl-bubble" [class]="'dl-bubble--' + download.status">
            <!-- Platform + status row -->
            <div class="dl-top">
              <div class="platform-chip"
                   [style.background]="downloadService.getPlatformColor(download.platform || 'unknown') + '18'"
                   [style.color]="downloadService.getPlatformColor(download.platform || 'unknown')"
                   [style.border-color]="downloadService.getPlatformColor(download.platform || 'unknown') + '25'">
                <span class="chip-dot" [style.background]="downloadService.getPlatformColor(download.platform || 'unknown')"></span>
                {{ downloadService.getPlatformName(download.platform || 'unknown') }}
              </div>
              <div class="status-pill" [class]="'status--' + download.status">
                @if (download.status === 'downloading' || download.status === 'extracting') {
                  <span class="pulse-dot"></span>
                }
                {{ download.status }}
              </div>
            </div>

            <!-- Title -->
            <div class="dl-title">{{ download.title || 'Fetching media info...' }}</div>

            <!-- Progress -->
            @if (download.status === 'downloading' || download.status === 'extracting') {
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="download.progress"></div>
              </div>
              <div class="progress-label">{{ download.progress | number:'1.0-1' }}% complete</div>
            }

            <!-- Completed -->
            @if (download.status === 'completed') {
              <div class="dl-complete">
                @if (download.fileSize) {
                  <span class="file-meta">{{ formatSize(download.fileSize) }}</span>
                }
                <a class="btn-save" [href]="downloadService.getFileUrl(download.id)" download>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="14" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  Save File
                </a>
              </div>
            }

            <!-- Failed -->
            @if (download.status === 'failed') {
              <div class="dl-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M7 4v3M7 9h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                {{ download.error }}
              </div>
            }

            <!-- Cancel -->
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
      max-width: 680px;
      margin: 36px auto 0;
    }

    .list-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      font-size: 1rem;
      font-weight: 700;
    }

    .count-badge {
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      background: rgba(124, 58, 237, 0.15);
      color: #a78bfa;
      font-size: 0.72rem;
      font-weight: 700;
    }

    /* ── Download card bubble ── */
    .dl-bubble {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 18px 20px;
      margin-bottom: 12px;
      box-shadow: var(--shadow-bubble);
      transition: border-color 0.3s, box-shadow 0.3s;
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(12px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .dl-bubble--downloading {
      border-color: rgba(124, 58, 237, 0.2);
      box-shadow: var(--shadow-bubble), 0 0 30px rgba(124, 58, 237, 0.08);
    }
    .dl-bubble--completed {
      border-color: rgba(16, 185, 129, 0.2);
    }
    .dl-bubble--failed {
      border-color: rgba(239, 68, 68, 0.15);
    }

    /* ── Top row ── */
    .dl-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .platform-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 11px;
      border-radius: var(--radius-pill);
      font-size: 0.7rem;
      font-weight: 700;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .chip-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
    }

    .status--queued {
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.04);
    }
    .status--extracting {
      color: var(--accent-orange);
      background: rgba(245, 158, 11, 0.08);
    }
    .status--downloading {
      color: #a78bfa;
      background: rgba(124, 58, 237, 0.1);
    }
    .status--completed {
      color: var(--accent-green);
      background: rgba(16, 185, 129, 0.08);
    }
    .status--failed {
      color: var(--accent-red);
      background: rgba(239, 68, 68, 0.08);
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    /* ── Title ── */
    .dl-title {
      color: var(--text-primary);
      font-size: 0.92rem;
      font-weight: 600;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Progress ── */
    .progress-track {
      height: 6px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #7c3aed, #a855f7, #ec4899);
      border-radius: 3px;
      transition: width 0.4s ease;
      box-shadow: 0 0 12px rgba(124, 58, 237, 0.4);
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-align: right;
      font-weight: 500;
    }

    /* ── Completed ── */
    .dl-complete {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .file-meta {
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 500;
    }

    .btn-save {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      padding: 8px 18px;
      border-radius: var(--radius-pill);
      font-family: inherit;
      font-weight: 700;
      font-size: 0.82rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-save:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.15));
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
      transform: translateY(-1px);
    }

    /* ── Error ── */
    .dl-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f87171;
      font-size: 0.82rem;
      font-weight: 500;
    }

    /* ── Cancel ── */
    .btn-cancel {
      margin-top: 10px;
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 5px 14px;
      border-radius: var(--radius-pill);
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.35);
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
