namespace AnyDownload.Api.Models;

public class DownloadRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Format { get; set; } // "mp4", "mp3", "webm", etc.
    public string? Quality { get; set; } // "best", "720p", "480p", "audio"
}
