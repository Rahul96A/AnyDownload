using Microsoft.AspNetCore.Mvc;
using AnyDownload.Api.Models;
using AnyDownload.Api.Services;

namespace AnyDownload.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DownloadController : ControllerBase
{
    private readonly YtDlpService _ytDlpService;
    private readonly ILogger<DownloadController> _logger;

    public DownloadController(YtDlpService ytDlpService, ILogger<DownloadController> logger)
    {
        _ytDlpService = ytDlpService;
        _logger = logger;
    }

    [HttpPost("info")]
    public async Task<ActionResult<MediaInfo>> GetInfo([FromBody] DownloadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { error = "URL is required" });

        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
            return BadRequest(new { error = "Invalid URL" });

        var info = await _ytDlpService.GetMediaInfoAsync(request.Url);
        if (info == null)
            return BadRequest(new { error = "Could not extract media info. The URL may be invalid or the platform may not be supported." });

        return Ok(info);
    }

    [HttpPost("start")]
    public async Task<ActionResult<DownloadResponse>> StartDownload([FromBody] DownloadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { error = "URL is required" });

        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
            return BadRequest(new { error = "Invalid URL" });

        var id = await _ytDlpService.StartDownloadAsync(request);
        var status = _ytDlpService.GetStatus(id);

        return Accepted(status);
    }

    [HttpGet("{id}/status")]
    public ActionResult<DownloadResponse> GetStatus(string id)
    {
        var status = _ytDlpService.GetStatus(id);
        if (status == null)
            return NotFound(new { error = "Download not found" });

        return Ok(status);
    }

    [HttpGet("{id}/file")]
    public IActionResult GetFile(string id)
    {
        var filePath = _ytDlpService.GetFilePath(id);
        if (filePath == null)
            return NotFound(new { error = "File not found or download not completed" });

        var fileName = Path.GetFileName(filePath);
        var contentType = fileName.EndsWith(".mp3") ? "audio/mpeg" : "video/mp4";
        return PhysicalFile(filePath, contentType, fileName);
    }

    [HttpDelete("{id}")]
    public ActionResult Cancel(string id)
    {
        var cancelled = _ytDlpService.CancelDownload(id);
        return cancelled ? Ok(new { message = "Download cancelled" }) : NotFound(new { error = "Download not found" });
    }

    [HttpGet("platforms")]
    public ActionResult GetSupportedPlatforms()
    {
        return Ok(new[]
        {
            new { id = "youtube", name = "YouTube", icon = "play_circle" },
            new { id = "instagram", name = "Instagram", icon = "camera_alt" },
            new { id = "x", name = "X (Twitter)", icon = "tag" },
            new { id = "linkedin", name = "LinkedIn", icon = "work" },
            new { id = "tiktok", name = "TikTok", icon = "music_note" },
            new { id = "facebook", name = "Facebook", icon = "facebook" },
            new { id = "reddit", name = "Reddit", icon = "forum" },
            new { id = "vimeo", name = "Vimeo", icon = "videocam" },
        });
    }
}
