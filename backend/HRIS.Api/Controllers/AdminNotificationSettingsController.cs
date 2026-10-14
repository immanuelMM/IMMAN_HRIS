using HRIS.Api.DTOs;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/admin/notification-settings")]
[Authorize(Roles = "Admin")]
public class AdminNotificationSettingsController : ControllerBase
{
    private readonly NotificationSettingsService _settings;

    public AdminNotificationSettingsController(NotificationSettingsService settings)
    {
        _settings = settings;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationSettingsDisplay>> Get()
    {
        return Ok(await _settings.GetDisplayAsync());
    }

    [HttpPut]
    public async Task<ActionResult<NotificationSettingsDisplay>> Update(UpdateNotificationSettingsRequest request)
    {
        await _settings.UpdateAsync(request);
        return Ok(await _settings.GetDisplayAsync());
    }

    [HttpPost("test-email")]
    public async Task<ActionResult<TestSendResponse>> TestEmail(TestEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email is required." });
        }

        var (success, note) = await _settings.SendEmailAsync(
            request.Email,
            "IMMAN HRIS test email",
            "This is a test message from IMMAN HRIS to confirm your email delivery settings are working.");
        return Ok(new TestSendResponse(success, note));
    }

    [HttpPost("test-sms")]
    public async Task<ActionResult<TestSendResponse>> TestSms(TestSmsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { message = "Phone number is required." });
        }

        var (success, note) = await _settings.SendSmsAsync(
            request.Phone,
            "This is a test SMS from IMMAN HRIS to confirm your SMS delivery settings are working.");
        return Ok(new TestSendResponse(success, note));
    }
}
