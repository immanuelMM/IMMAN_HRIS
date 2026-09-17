namespace HRIS.Api.Services;

/// <summary>
/// The Philippines does not observe daylight saving time, so its wall-clock time
/// is always exactly UTC+8. Using a fixed offset here — rather than the server's
/// OS/container timezone, which varies by deployment region (e.g. Oregon) — keeps
/// attendance dates and timestamps correct no matter where this is hosted.
/// </summary>
public static class PhilippineTime
{
    // Kind is set to Unspecified (a "naive" wall-clock value) rather than Utc:
    // the value itself is already shifted to PHT, so tagging it Utc would be a
    // lie, and it also matches how EF Core/Npgsql map plain DateTime columns
    // ("timestamp without time zone") without extra provider-specific config.
    public static DateTime Now => DateTime.SpecifyKind(DateTime.UtcNow.AddHours(8), DateTimeKind.Unspecified);

    public static DateOnly Today => DateOnly.FromDateTime(Now);
}
