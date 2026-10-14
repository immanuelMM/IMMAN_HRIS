using System.Net;
using System.Net.Mail;
using System.Text.Json;
using HRIS.Api.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using NotificationSettingsEntity = HRIS.Api.Models.NotificationSettings;

namespace HRIS.Api.Services;

public record EffectiveNotificationConfig(
    string? SmtpHost,
    int SmtpPort,
    string? SmtpUsername,
    string? SmtpPassword,
    string? SmtpFromEmail,
    string? SmtpFromName,
    bool SmtpUseSsl,
    string? SemaphoreApiKey,
    string? SemaphoreSenderName)
{
    public bool SmtpConfigured => !string.IsNullOrWhiteSpace(SmtpHost) && !string.IsNullOrWhiteSpace(SmtpUsername) && !string.IsNullOrWhiteSpace(SmtpPassword);
    public bool SmsConfigured => !string.IsNullOrWhiteSpace(SemaphoreApiKey);
}

public record NotificationSettingsDisplay(
    string? SmtpHost,
    int? SmtpPort,
    string? SmtpUsername,
    bool SmtpPasswordSet,
    string? SmtpFromEmail,
    string? SmtpFromName,
    bool SmtpUseSsl,
    bool SmsApiKeySet,
    string? SemaphoreSenderName,
    bool SmtpEnvFallbackAvailable,
    bool SmsEnvFallbackAvailable,
    bool SmtpEffectivelyConfigured,
    bool SmsEffectivelyConfigured);

public record UpdateNotificationSettingsRequest(
    string? SmtpHost,
    int? SmtpPort,
    string? SmtpUsername,
    string? SmtpPassword,
    string? SmtpFromEmail,
    string? SmtpFromName,
    bool SmtpUseSsl,
    string? SemaphoreApiKey,
    string? SemaphoreSenderName);

/// <summary>
/// Owns the admin-configurable SMTP/SMS settings (stored in Postgres, secrets
/// encrypted via Data Protection) and the actual low-level send calls. Settings
/// entered through the admin UI take priority; unset fields fall back to the
/// matching environment variable (see PinDeliveryService's original doc comment
/// for the env var names), so a deployment can still be configured purely by
/// env vars if preferred.
/// </summary>
public class NotificationSettingsService
{
    private readonly HrisDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationSettingsService> _logger;
    private readonly IDataProtector _protector;

    public NotificationSettingsService(
        HrisDbContext db,
        IConfiguration config,
        IHttpClientFactory httpClientFactory,
        IDataProtectionProvider dataProtectionProvider,
        ILogger<NotificationSettingsService> logger)
    {
        _db = db;
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _protector = dataProtectionProvider.CreateProtector("HRIS.NotificationSettings.v1");
    }

    private async Task<NotificationSettingsEntity> GetOrCreateRowAsync()
    {
        var row = await _db.NotificationSettings.FirstOrDefaultAsync(s => s.Id == 1);
        if (row is null)
        {
            row = new NotificationSettingsEntity { Id = 1, UpdatedAtUtc = DateTime.UtcNow };
            _db.NotificationSettings.Add(row);
            await _db.SaveChangesAsync();
        }
        return row;
    }

    public async Task<NotificationSettingsDisplay> GetDisplayAsync()
    {
        var row = await GetOrCreateRowAsync();
        var effective = await GetEffectiveConfigAsync();

        return new NotificationSettingsDisplay(
            row.SmtpHost,
            row.SmtpPort,
            row.SmtpUsername,
            !string.IsNullOrEmpty(row.SmtpPasswordProtected),
            row.SmtpFromEmail,
            row.SmtpFromName,
            row.SmtpUseSsl,
            !string.IsNullOrEmpty(row.SemaphoreApiKeyProtected),
            row.SemaphoreSenderName,
            !string.IsNullOrWhiteSpace(_config["SMTP_HOST"]) && !string.IsNullOrWhiteSpace(_config["SMTP_USERNAME"]) && !string.IsNullOrWhiteSpace(_config["SMTP_PASSWORD"]),
            !string.IsNullOrWhiteSpace(_config["SEMAPHORE_API_KEY"]),
            effective.SmtpConfigured,
            effective.SmsConfigured);
    }

    public async Task UpdateAsync(UpdateNotificationSettingsRequest request)
    {
        var row = await GetOrCreateRowAsync();

        row.SmtpHost = NullIfBlank(request.SmtpHost);
        row.SmtpPort = request.SmtpPort;
        row.SmtpUsername = NullIfBlank(request.SmtpUsername);
        row.SmtpFromEmail = NullIfBlank(request.SmtpFromEmail);
        row.SmtpFromName = NullIfBlank(request.SmtpFromName);
        row.SmtpUseSsl = request.SmtpUseSsl;
        row.SemaphoreSenderName = NullIfBlank(request.SemaphoreSenderName);

        // A blank secret field means "leave the currently stored value
        // untouched" — the UI never round-trips the decrypted secret back
        // to the admin, so there's nothing else it could mean.
        if (!string.IsNullOrEmpty(request.SmtpPassword))
        {
            row.SmtpPasswordProtected = _protector.Protect(request.SmtpPassword);
        }
        if (!string.IsNullOrEmpty(request.SemaphoreApiKey))
        {
            row.SemaphoreApiKeyProtected = _protector.Protect(request.SemaphoreApiKey);
        }

        row.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<EffectiveNotificationConfig> GetEffectiveConfigAsync()
    {
        var row = await GetOrCreateRowAsync();

        string? Unprotect(string? protectedValue)
        {
            if (string.IsNullOrEmpty(protectedValue)) return null;
            try
            {
                return _protector.Unprotect(protectedValue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to decrypt a stored notification secret.");
                return null;
            }
        }

        var smtpPort = row.SmtpPort ?? (int.TryParse(_config["SMTP_PORT"], out var envPort) ? envPort : 587);
        var smtpUsername = row.SmtpUsername ?? _config["SMTP_USERNAME"];
        var smtpPassword = Unprotect(row.SmtpPasswordProtected) ?? _config["SMTP_PASSWORD"];

        return new EffectiveNotificationConfig(
            SmtpHost: row.SmtpHost ?? _config["SMTP_HOST"],
            SmtpPort: smtpPort,
            SmtpUsername: smtpUsername,
            SmtpPassword: smtpPassword,
            SmtpFromEmail: row.SmtpFromEmail ?? _config["SMTP_FROM_EMAIL"] ?? smtpUsername,
            SmtpFromName: row.SmtpFromName ?? _config["SMTP_FROM_NAME"] ?? "IMMAN HRIS",
            SmtpUseSsl: row.SmtpUseSsl,
            SemaphoreApiKey: Unprotect(row.SemaphoreApiKeyProtected) ?? _config["SEMAPHORE_API_KEY"],
            SemaphoreSenderName: row.SemaphoreSenderName ?? _config["SEMAPHORE_SENDER_NAME"]);
    }

    public async Task<(bool Success, string Note)> SendEmailAsync(string toEmail, string subject, string body)
    {
        var cfg = await GetEffectiveConfigAsync();
        if (!cfg.SmtpConfigured)
        {
            _logger.LogInformation("[SIMULATED EMAIL] To {Email}: {Subject} — {Body}", toEmail, subject, body);
            return (true, "Simulated — no real email was sent. Configure SMTP settings to enable real delivery.");
        }

        try
        {
            using var client = new SmtpClient(cfg.SmtpHost, cfg.SmtpPort)
            {
                Credentials = new NetworkCredential(cfg.SmtpUsername, cfg.SmtpPassword),
                EnableSsl = cfg.SmtpUseSsl,
            };
            using var mail = new MailMessage
            {
                From = new MailAddress(cfg.SmtpFromEmail ?? cfg.SmtpUsername!, cfg.SmtpFromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false,
            };
            mail.To.Add(toEmail);

            await client.SendMailAsync(mail);
            _logger.LogInformation("Sent email to {Email} via SMTP.", toEmail);
            return (true, "Sent via real email (SMTP).");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} via SMTP.", toEmail);
            return (false, $"Failed to send: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Note)> SendSmsAsync(string phone, string message)
    {
        var cfg = await GetEffectiveConfigAsync();
        if (!cfg.SmsConfigured)
        {
            _logger.LogInformation("[SIMULATED SMS] To {Phone}: {Message}", phone, message);
            return (true, "Simulated — no real SMS was sent. Configure SMS settings to enable real delivery.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient("PinDeliverySms");
            var form = new Dictionary<string, string>
            {
                ["apikey"] = cfg.SemaphoreApiKey!,
                ["number"] = phone,
                ["message"] = message,
            };
            if (!string.IsNullOrWhiteSpace(cfg.SemaphoreSenderName))
            {
                form["sendername"] = cfg.SemaphoreSenderName;
            }

            using var response = await client.PostAsync(
                "https://api.semaphore.co/api/v4/messages", new FormUrlEncodedContent(form));
            var responseBody = await response.Content.ReadAsStringAsync();

            // Semaphore returns HTTP 200 even on failure (e.g. an invalid API
            // key), with the error details in the JSON body — a successful
            // send is a JSON array of message objects, anything else is an
            // error, so the status code alone can't be trusted here.
            var isSuccess = response.IsSuccessStatusCode
                && JsonDocument.Parse(responseBody).RootElement.ValueKind == JsonValueKind.Array;

            if (!isSuccess)
            {
                _logger.LogError("Semaphore SMS send to {Phone} failed with status {Status}: {Body}", phone, response.StatusCode, responseBody);
                return (false, $"Failed to send: {responseBody}");
            }

            _logger.LogInformation("Sent SMS to {Phone} via Semaphore.", phone);
            return (true, "Sent via real SMS (Semaphore).");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Phone} via Semaphore.", phone);
            return (false, $"Failed to send: {ex.Message}");
        }
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
