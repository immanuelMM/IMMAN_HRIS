using HRIS.Api.Models;

namespace HRIS.Api.Services;

public record PinDeliveryResult(string? Channel, string? Destination, bool Delivered, string Note);

/// <summary>
/// Decides which channel (phone vs email) to use for a PIN reset and
/// templates the message. The actual send — and whether it's real or
/// simulated — is handled by <see cref="NotificationSettingsService"/>, which
/// is configured via Admin → Settings or the matching environment variables.
/// </summary>
public class PinDeliveryService
{
    private readonly NotificationSettingsService _notifications;

    public PinDeliveryService(NotificationSettingsService notifications)
    {
        _notifications = notifications;
    }

    public async Task<PinDeliveryResult> DeliverAsync(string? requestedChannel, Employee employee, string username, string pin)
    {
        var hasPhone = !string.IsNullOrWhiteSpace(employee.ContactNumber);
        var hasEmail = !string.IsNullOrWhiteSpace(employee.Email);

        var channel = NormalizeChannel(requestedChannel);

        // No explicit choice (or an unavailable one) — fall back to whichever
        // single channel is available.
        if (channel is null || (channel == "phone" && !hasPhone) || (channel == "email" && !hasEmail))
        {
            channel = hasPhone ? "phone" : hasEmail ? "email" : null;
        }

        var message = $"Your HRIS PIN was reset. Username: {username} / New PIN: {pin}. Keep this confidential.";

        if (channel == "phone")
        {
            var (success, note) = await _notifications.SendSmsAsync(employee.ContactNumber, message);
            return new PinDeliveryResult("phone", employee.ContactNumber, success, note);
        }

        if (channel == "email")
        {
            var (success, note) = await _notifications.SendEmailAsync(employee.Email, "Your HRIS PIN has been reset", message);
            return new PinDeliveryResult("email", employee.Email, success, note);
        }

        return new PinDeliveryResult(null, null, false,
            "Employee has no phone number or email on file — share the new PIN manually.");
    }

    private static string? NormalizeChannel(string? channel) => channel?.Trim().ToLowerInvariant() switch
    {
        "phone" => "phone",
        "email" => "email",
        _ => null,
    };
}
