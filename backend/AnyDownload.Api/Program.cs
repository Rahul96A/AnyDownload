using AnyDownload.Api.Hubs;
using AnyDownload.Api.Services;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddSingleton<YtDlpService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Wire up SignalR progress notifications
var ytDlpService = app.Services.GetRequiredService<YtDlpService>();
var hubContext = app.Services.GetRequiredService<IHubContext<DownloadHub>>();
ytDlpService.OnProgressUpdate += (id, response) =>
{
    hubContext.Clients.Group(id).SendAsync("DownloadProgress", response);
};

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
app.MapControllers();
app.MapHub<DownloadHub>("/hubs/download");

app.Run();
