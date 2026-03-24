using Microsoft.AspNetCore.SignalR;

namespace AnyDownload.Api.Hubs;

public class DownloadHub : Hub
{
    public async Task JoinDownload(string downloadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, downloadId);
    }

    public async Task LeaveDownload(string downloadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, downloadId);
    }
}
