namespace AnyDownload.Api.Models;

public class MediaInfo
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Thumbnail { get; set; }
    public string Platform { get; set; } = string.Empty;
    public double? Duration { get; set; }
    public List<FormatOption> Formats { get; set; } = new();
}

public class FormatOption
{
    public string FormatId { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public string? Quality { get; set; }
    public long? FileSize { get; set; }
    public string? Resolution { get; set; }
    public bool HasVideo { get; set; }
    public bool HasAudio { get; set; }
}
