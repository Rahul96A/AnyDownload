import { Component } from '@angular/core';
import { UrlInputComponent } from './components/url-input/url-input';
import { DownloadListComponent } from './components/download-list/download-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UrlInputComponent, DownloadListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'AnyDownload';
}
