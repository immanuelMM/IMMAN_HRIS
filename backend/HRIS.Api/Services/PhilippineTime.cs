namespace HRIS.Api.Services;

/// <summary>
/// The Philippines does not observe daylight saving time, so its wall-clock time
/// is always exactly UTC+8. Using a fixed offset here — rather than the server's
/// OS/container timezone, which varies by deployment region (e.g. Oregon) — keeps
/// attendance dates and timestamps correct no matter where this is hosted.
/// </summary>
public static class PhilippineTime
{
    public static DateTime Now => DateTime.UtcNow.AddHours(8);

    public static DateOnly Today => DateOnly.FromDateTime(Now);
}
