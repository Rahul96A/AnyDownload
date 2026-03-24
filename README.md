# AnyDownload

A cross-platform video downloader with a social-bubble themed UI. Paste a link from your favorite social platform, pick a quality, and download.

## Supported Platforms

| Platform | Status |
|----------|--------|
| YouTube | Supported |
| Instagram | Supported |
| X (Twitter) | Supported |
| LinkedIn | Supported |
| TikTok | Supported |
| Facebook | Supported |
| Reddit | Supported |
| Vimeo | Supported |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21 (standalone components, signals, zoneless) |
| Backend | .NET 8 Web API |
| Real-time | SignalR (download progress) |
| Extraction | yt-dlp |
| Styling | SCSS with glassmorphism / social bubble theme |

## Project Structure

```
AnyDownload/
├── frontend/                    # Angular 21 app
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── url-input/   # URL input + platform detection + quality picker
│       │   │   └── download-list/ # Active/completed download cards
│       │   ├── services/        # DownloadService (HTTP + SignalR)
│       │   └── models/          # TypeScript interfaces
│       ├── environments/        # Dev/prod configs
│       └── styles.scss          # Global theme (social bubble)
├── backend/                     # .NET 8 Web API
│   └── AnyDownload.Api/
│       ├── Controllers/         # DownloadController (REST endpoints)
│       ├── Services/            # YtDlpService, PlatformDetector
│       ├── Hubs/                # SignalR hub for progress updates
│       └── Models/              # Request/response DTOs
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (`pip install yt-dlp`)

### Run the Backend

```bash
cd backend/AnyDownload.Api
dotnet run --urls "http://localhost:5000"
```

### Run the Frontend

```bash
cd frontend
npm install
npx ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/download/info` | Get media info (title, formats, thumbnail) |
| POST | `/api/download/start` | Start a download job |
| GET | `/api/download/{id}/status` | Check download progress |
| GET | `/api/download/{id}/file` | Download the completed file |
| DELETE | `/api/download/{id}` | Cancel a download |
| GET | `/api/download/platforms` | List supported platforms |

## Architecture

```
Browser ──► Angular App ──► .NET Web API ──► yt-dlp (subprocess)
               │                  │
               │ SignalR           │ Progress parsing
               ◄──────────────────┘
```

- **Frontend** sends a URL to the backend, then joins a SignalR group for that download ID.
- **Backend** spawns a `yt-dlp` process, parses stdout for progress updates, and pushes them to the client via SignalR.
- **Completed files** are stored temporarily and served via the `/file` endpoint. A background cleanup service removes old files.

## Features

- Auto-detects platform from pasted URL (shows colored badge)
- Quality picker: Best / 1080p / 720p / 480p / Audio Only
- Real-time download progress via SignalR
- Glassmorphism social-bubble UI with animated background
- Lazy SignalR connection (app works even if backend is down)
- Temporary file cleanup with configurable retention

## License

MIT
