namespace AnyDownload.Api.Services;

public static class PlatformDetector
{
    public static string Detect(string url)
    {
        var uri = new Uri(url);
        var host = uri.Host.ToLowerInvariant();

        return host switch
        {
            _ when host.Contains("youtube.com") || host.Contains("youtu.be") => "youtube",
            _ when host.Contains("instagram.com") => "instagram",
            _ when host.Contains("twitter.com") || host.Contains("x.com") => "x",
            _ when host.Contains("linkedin.com") => "linkedin",
            _ when host.Contains("tiktok.com") => "tiktok",
            _ when host.Contains("facebook.com") || host.Contains("fb.watch") => "facebook",
            _ when host.Contains("reddit.com") => "reddit",
            _ when host.Contains("vimeo.com") => "vimeo",
            _ => "unknown"
        };
    }

    public static bool IsSupported(string url)
    {
        try
        {
            var platform = Detect(url);
            return platform != "unknown";
        }
        catch
        {
            return false;
        }
    }
}
