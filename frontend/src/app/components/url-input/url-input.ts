import { Component, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DownloadService } from '../../services/download.service';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="url-input-container">
      <div class="input-wrapper" [class.has-platform]="detectedPlatform()">
        @if (detectedPlatform()) {
          <div class="platform-badge" [style.background-color]="downloadService.getPlatformColor(detectedPlatform())">
            {{ downloadService.getPlatformName(detectedPlatform()) }}
          </div>
        }
        <input
          type="url"
          [ngModel]="url()"
          (ngModelChange)="onUrlChange($event)"
          placeholder="Paste a video URL from YouTube, Instagram, X, LinkedIn..."
          [disabled]="loading()"
          (keydown.enter)="onSubmit()"
        />
        <div class="input-actions">
          @if (url()) {
            <button class="btn-clear" (click)="clear()" title="Clear">&#x2715;</button>
          }
          <button
            class="btn-download"
            (click)="onSubmit()"
            [disabled]="!url() || loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
            } @else {
              Download
            }
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      <div class="quality-options">
        <label class="quality-option" [class.selected]="quality() === 'best'">
          <input type="radio" name="quality" value="best" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>Best</span>
        </label>
        <label class="quality-option" [class.selected]="quality() === '1080p'">
          <input type="radio" name="quality" value="1080p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>1080p</span>
        </label>
        <label class="quality-option" [class.selected]="quality() === '720p'">
          <input type="radio" name="quality" value="720p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>720p</span>
        </label>
        <label class="quality-option" [class.selected]="quality() === '480p'">
          <input type="radio" name="quality" value="480p" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>480p</span>
        </label>
        <label class="quality-option" [class.selected]="quality() === 'audio'">
          <input type="radio" name="quality" value="audio" [ngModel]="quality()" (ngModelChange)="quality.set($event)" />
          <span>Audio Only</span>
        </label>
      </div>
    </div>
  `,
  styles: [`
    .url-input-container {
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      background: #1e1e2e;
      border: 2px solid #313244;
      border-radius: 16px;
      padding: 6px 6px 6px 20px;
      transition: border-color 0.2s;
      gap: 8px;
    }

    .input-wrapper:focus-within {
      border-color: #6366f1;
    }

    .platform-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      background: transparent;
      border: none;
      color: #cdd6f4;
      font-size: 1rem;
      outline: none;
      min-width: 0;
    }

    input::placeholder {
      color: #6c7086;
    }

    .input-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .btn-clear {
      background: transparent;
      border: none;
      color: #6c7086;
      cursor: pointer;
      padding: 8px;
      font-size: 1rem;
      border-radius: 8px;
    }

    .btn-clear:hover {
      color: #cdd6f4;
      background: #313244;
    }

    .btn-download {
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-download:hover:not(:disabled) {
      background: #4f46e5;
    }

    .btn-download:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      color: #f38ba8;
      font-size: 0.85rem;
      margin-top: 8px;
      padding-left: 20px;
    }

    .quality-options {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .quality-option {
      cursor: pointer;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      color: #a6adc8;
      background: #1e1e2e;
      border: 1px solid #313244;
      transition: all 0.2s;

      input { display: none; }
    }

    .quality-option:hover {
      border-color: #6366f1;
      color: #cdd6f4;
    }

    .quality-option.selected {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }
  `]
})
export class UrlInputComponent {
  url = signal('');
  quality = signal('best');
  loading = signal(false);
  error = signal('');
  detectedPlatform = signal('');

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
