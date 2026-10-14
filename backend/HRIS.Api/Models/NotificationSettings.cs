namespace HRIS.Api.Models;

/// <summary>
/// Single-row table (Id is always 1) holding the admin-configured SMTP/SMS
/// delivery settings. Secrets are stored encrypted via ASP.NET Core Data
/// Protection, never in plain text.
/// </summary>
public class NotificationSettings
{
    public int Id { get; set; } = 1;

    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPasswordProtected { get; set; }
    public string? SmtpFromEmail { get; set; }
    public string? SmtpFromName { get; set; }
    public bool SmtpUseSsl { get; set; } = true;

    public string? SemaphoreApiKeyProtected { get; set; }
    public string? SemaphoreSenderName { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
