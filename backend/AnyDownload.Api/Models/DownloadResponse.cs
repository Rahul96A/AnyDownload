namespace AnyDownload.Api.Models;

public class DownloadResponse
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = "queued"; // queued, extracting, downloading, completed, failed
    public string? Title { get; set; }
    public string? Thumbnail { get; set; }
    public string? Platform { get; set; }
    public double Progress { get; set; }
    public string? DownloadUrl { get; set; }
    public string? Error { get; set; }
    public long? FileSize { get; set; }
    public string? FileName { get; set; }
}
