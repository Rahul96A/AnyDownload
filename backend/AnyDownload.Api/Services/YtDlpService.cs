using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;
using AnyDownload.Api.Models;

namespace AnyDownload.Api.Services;

public class YtDlpService : IDisposable
{
    private readonly ILogger<YtDlpService> _logger;
    private readonly string _tempDir;
    private readonly ConcurrentDictionary<string, DownloadResponse> _downloads = new();
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _cancellations = new();
    private readonly Timer _cleanupTimer;

    public event Action<string, DownloadResponse>? OnProgressUpdate;

    public YtDlpService(ILogger<YtDlpService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _tempDir = configuration.GetValue<string>("Download:TempDirectory") is string dir && !string.IsNullOrEmpty(dir)
            ? dir
            : Path.Combine(Path.GetTempPath(), "anydownload");
        Directory.CreateDirectory(_tempDir);

        // Cleanup files older than 1 hour every 10 minutes
        _cleanupTimer = new Timer(CleanupOldFiles, null, TimeSpan.FromMinutes(10), TimeSpan.FromMinutes(10));
    }

    public DownloadResponse? GetStatus(string id) => _downloads.TryGetValue(id, out var d) ? d : null;

    public async Task<MediaInfo?> GetMediaInfoAsync(string url, CancellationToken ct = default)
    {
        var platform = PlatformDetector.Detect(url);
        var args = $"--dump-json --no-download \"{url}\"";

        var (exitCode, output, error) = await RunYtDlpAsync(args, ct);

        if (exitCode != 0)
        {
            _logger.LogError("yt-dlp info extraction failed: {Error}", error);
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(output);
            var root = doc.RootElement;

            var info = new MediaInfo
            {
                Id = root.GetProperty("id").GetString() ?? "",
                Title = root.GetProperty("title").GetString() ?? "",
                Thumbnail = root.TryGetProperty("thumbnail", out var thumb) ? thumb.GetString() : null,
                Platform = platform,
                Duration = root.TryGetProperty("duration", out var dur) ? dur.GetDouble() : null,
            };

            if (root.TryGetProperty("formats", out var formats))
            {
                foreach (var fmt in formats.EnumerateArray())
                {
                    var hasVideo = fmt.TryGetProperty("vcodec", out var vc) && vc.GetString() != "none";
                    var hasAudio = fmt.TryGetProperty("acodec", out var ac) && ac.GetString() != "none";

                    info.Formats.Add(new FormatOption
                    {
                        FormatId = fmt.TryGetProperty("format_id", out var fid) ? fid.GetString() ?? "" : "",
                        Extension = fmt.TryGetProperty("ext", out var ext) ? ext.GetString() ?? "" : "",
                        Quality = fmt.TryGetProperty("format_note", out var fn) ? fn.GetString() : null,
                        FileSize = fmt.TryGetProperty("filesize", out var fs) && fs.ValueKind == JsonValueKind.Number ? fs.GetInt64() : null,
                        Resolution = fmt.TryGetProperty("resolution", out var res) ? res.GetString() : null,
                        HasVideo = hasVideo,
                        HasAudio = hasAudio,
                    });
                }
            }

            return info;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse yt-dlp JSON output");
            return null;
        }
    }

    public async Task<string> StartDownloadAsync(DownloadRequest request)
    {
        var id = Guid.NewGuid().ToString("N")[..12];
        var cts = new CancellationTokenSource();
        _cancellations[id] = cts;

        var response = new DownloadResponse
        {
            Id = id,
            Status = "queued",
            Platform = PlatformDetector.Detect(request.Url),
        };
        _downloads[id] = response;

        _ = Task.Run(() => ExecuteDownloadAsync(id, request, cts.Token), cts.Token);
        return id;
    }

    public bool CancelDownload(string id)
    {
        if (_cancellations.TryGetValue(id, out var cts))
        {
            cts.Cancel();
            return true;
        }
        return false;
    }

    public string? GetFilePath(string id)
    {
        if (_downloads.TryGetValue(id, out var d) && d.Status == "completed" && d.FileName != null)
        {
            var path = Path.Combine(_tempDir, d.FileName);
            return File.Exists(path) ? path : null;
        }
        return null;
    }

    private async Task ExecuteDownloadAsync(string id, DownloadRequest request, CancellationToken ct)
    {
        var download = _downloads[id];

        try
        {
            // Phase 1: Extract info
            download.Status = "extracting";
            NotifyProgress(id, download);

            var quality = request.Quality?.ToLowerInvariant() switch
            {
                "audio" => "-x --audio-format mp3",
                "720p" => "-f \"bestvideo[height<=720]+bestaudio/best[height<=720]\"",
                "480p" => "-f \"bestvideo[height<=480]+bestaudio/best[height<=480]\"",
                "1080p" => "-f \"bestvideo[height<=1080]+bestaudio/best[height<=1080]\"",
                _ => "-f \"bestvideo+bestaudio/best\""
            };

            var outputTemplate = Path.Combine(_tempDir, $"{id}_%(title)s.%(ext)s");
            var args = $"{quality} --merge-output-format mp4 -o \"{outputTemplate}\" --newline --no-playlist \"{request.Url}\"";

            if (request.Quality?.ToLowerInvariant() == "audio")
            {
                args = $"-x --audio-format mp3 -o \"{outputTemplate}\" --newline --no-playlist \"{request.Url}\"";
            }

            // Phase 2: Download
            download.Status = "downloading";
            NotifyProgress(id, download);

            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            process.Start();

            var progressRegex = new Regex(@"\[download\]\s+(\d+\.?\d*)%");
            var titleRegex = new Regex(@"\[download\] Destination: (.+)");
            string? lastDestination = null;

            while (!process.StandardOutput.EndOfStream)
            {
                ct.ThrowIfCancellationRequested();
                var line = await process.StandardOutput.ReadLineAsync(ct);
                if (line == null) continue;

                var progressMatch = progressRegex.Match(line);
                if (progressMatch.Success && double.TryParse(progressMatch.Groups[1].Value, out var pct))
                {
                    download.Progress = pct;
                    NotifyProgress(id, download);
                }

                var destMatch = titleRegex.Match(line);
                if (destMatch.Success)
                {
                    lastDestination = destMatch.Groups[1].Value.Trim();
                }
            }

            await process.WaitForExitAsync(ct);

            if (process.ExitCode != 0)
            {
                var error = await process.StandardError.ReadToEndAsync(ct);
                throw new Exception($"yt-dlp failed (exit code {process.ExitCode}): {error}");
            }

            // Find the output file
            var files = Directory.GetFiles(_tempDir, $"{id}_*").OrderByDescending(File.GetCreationTime).ToArray();
            if (files.Length == 0)
                throw new Exception("Download completed but no output file found");

            var outputFile = files[0];
            var fileInfo = new FileInfo(outputFile);

            download.Status = "completed";
            download.Progress = 100;
            download.FileName = Path.GetFileName(outputFile);
            download.FileSize = fileInfo.Length;
            download.Title = Path.GetFileNameWithoutExtension(outputFile).Replace($"{id}_", "");
            download.DownloadUrl = $"/api/download/{id}/file";
            NotifyProgress(id, download);
        }
        catch (OperationCanceledException)
        {
            download.Status = "failed";
            download.Error = "Download cancelled";
            NotifyProgress(id, download);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Download {Id} failed", id);
            download.Status = "failed";
            download.Error = ex.Message;
            NotifyProgress(id, download);
        }
    }

    private void NotifyProgress(string id, DownloadResponse response)
    {
        OnProgressUpdate?.Invoke(id, response);
    }

    private async Task<(int ExitCode, string Output, string Error)> RunYtDlpAsync(string args, CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "yt-dlp",
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = new Process { StartInfo = psi };
        process.Start();

        var output = await process.StandardOutput.ReadToEndAsync(ct);
        var error = await process.StandardError.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        return (process.ExitCode, output, error);
    }

    private void CleanupOldFiles(object? state)
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddHours(-1);
            foreach (var file in Directory.GetFiles(_tempDir))
            {
                if (File.GetCreationTimeUtc(file) < cutoff)
                {
                    try { File.Delete(file); } catch { /* ignore */ }
                }
            }

            // Clean up completed/failed entries older than 1 hour
            var staleIds = _downloads
                .Where(kv => kv.Value.Status is "completed" or "failed")
                .Select(kv => kv.Key)
                .ToList();

            foreach (var staleId in staleIds)
            {
                _downloads.TryRemove(staleId, out _);
                _cancellations.TryRemove(staleId, out _);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cleanup failed");
        }
    }

    public void Dispose()
    {
        _cleanupTimer.Dispose();
        foreach (var cts in _cancellations.Values)
        {
            cts.Cancel();
            cts.Dispose();
        }
    }
}
