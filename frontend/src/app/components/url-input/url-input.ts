import { Component, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DownloadService } from '../../services/download.service';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="url-input-container">
      <!-- Main input bubble -->
      <div class="input-bubble" [class.has-platform]="detectedPlatform()" [class.focused]="isFocused()">
        @if (detectedPlatform()) {
          <div class="platform-pill" [style.background]="downloadService.getPlatformColor(detectedPlatform()) + '22'" [style.color]="downloadService.getPlatformColor(detectedPlatform())" [style.border-color]="downloadService.getPlatformColor(detectedPlatform()) + '33'">
            <span class="platform-dot" [style.background]="downloadService.getPlatformColor(detectedPlatform())"></span>
            {{ downloadService.getPlatformName(detectedPlatform()) }}
          </div>
        }
        <input
          type="url"
          [ngModel]="url()"
          (ngModelChange)="onUrlChange($event)"
          (focus)="isFocused.set(true)"
          (blur)="isFocused.set(false)"
          placeholder="Paste any video URL here..."
          [disabled]="loading()"
          (keydown.enter)="onSubmit()"
        />
        <div class="input-actions">
          @if (url()) {
            <button class="btn-clear" (click)="clear()" title="Clear">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          }
          <button
            class="btn-go"
            (click)="onSubmit()"
            [disabled]="!url() || loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v10m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="5" y1="17" x2="15" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span>Download</span>
            }
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="error-bubble">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M7 4v3M7 9h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ error() }}
        </div>
      }

      <!-- Quality picker bubbles -->
      <div class="quality-row">
        <label class="q-bubble" [class.active]="quality() === 'best'">
          <input type="radio" name="quality" value="best" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>Best</span>
        </label>
        <label class="q-bubble" [class.active]="quality() === '1080p'">
          <input type="radio" name="quality" value="1080p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>1080p</span>
        </label>
        <label class="q-bubble" [class.active]="quality() === '720p'">
          <input type="radio" name="quality" value="720p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>720p</span>
        </label>
        <label class="q-bubble" [class.active]="quality() === '480p'">
          <input type="radio" name="quality" value="480p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>480p</span>
        </label>
        <label class="q-bubble" [class.active]="quality() === 'audio'">
          <input type="radio" name="quality" value="audio" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M10 3.5c1.1.9 1.1 3.1 0 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="5" cy="10" r="2" fill="currentColor"/></svg>
          <span>Audio</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .url-input-container {
      width: 100%;
      max-width: 680px;
      margin: 0 auto;
    }

    /* ── Main input bubble ── */
    .input-bubble {
      display: flex;
      align-items: center;
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-bubble);
      padding: 8px 8px 8px 22px;
      gap: 10px;
      box-shadow: var(--shadow-bubble);
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    .input-bubble.focused {
      border-color: var(--border-glow);
      box-shadow: var(--shadow-bubble), var(--shadow-glow);
    }

    .input-bubble.has-platform {
      border-color: rgba(124, 58, 237, 0.15);
    }

    /* ── Platform detection pill ── */
    .platform-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .platform-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    @keyframes popIn {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* ── Input field ── */
    input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 500;
      outline: none;
      min-width: 0;
    }

    input::placeholder {
      color: var(--text-muted);
      font-weight: 400;
    }

    /* ── Action buttons ── */
    .input-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .btn-clear {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .btn-clear:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.06);
    }

    .btn-go {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: white;
      border: none;
      padding: 12px 22px;
      border-radius: var(--radius-pill);
      font-family: inherit;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.25s;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
      letter-spacing: 0.01em;
    }

    .btn-go:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 28px rgba(124, 58, 237, 0.45);
      background: linear-gradient(135deg, #6d28d9, #9333ea);
    }

    .btn-go:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-go:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      box-shadow: none;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.25);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Error bubble ── */
    .error-bubble {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      margin-left: 22px;
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #f87171;
      font-size: 0.82rem;
      font-weight: 500;
      animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* ── Quality picker row ── */
    .quality-row {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .q-bubble {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      padding: 8px 18px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-glass);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
      transition: all 0.25s;
      user-select: none;

      input { display: none; }
    }

    .q-bubble:hover {
      border-color: rgba(124, 58, 237, 0.25);
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    .q-bubble.active {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(168, 85, 247, 0.15));
      border-color: rgba(124, 58, 237, 0.35);
      color: #c4b5fd;
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
    }
  `]
})
export class UrlInputComponent {
  url = signal('');
  quality = signal('best');
  loading = signal(false);
  error = signal('');
  detectedPlatform = signal('');
  isFocused = signal(false);

  downloadRequested = output<{ url: string; quality: string }>();

  constructor(public downloadService: DownloadService) {}

  onUrlChange(value: string): void {
    this.url.set(value);
    this.error.set('');
    if (value) {
      this.detectedPlatform.set(this.downloadService.detectPlatform(value));
    } else {
      this.detectedPlatform.set('');
    }
  }

  clear(): void {
    this.url.set('');
    this.error.set('');
    this.detectedPlatform.set('');
  }

  async onSubmit(): Promise<void> {
    const url = this.url().trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      this.error.set('Please enter a valid URL');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.downloadService.startDownload({ url, quality: this.quality() });
      this.clear();
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to start download. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
