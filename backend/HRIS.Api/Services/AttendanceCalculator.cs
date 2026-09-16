namespace HRIS.Api.Services;

public static class AttendanceCalculator
{
    private const double BreakHours = 1.0;

    public static double? ComputeDailyHours(DateTime? timeIn, DateTime? timeOut)
    {
        if (timeIn is null || timeOut is null) return null;

        var hours = (timeOut.Value - timeIn.Value).TotalHours - BreakHours;
        return Math.Round(Math.Max(hours, 0), 2);
    }

    public static DateOnly GetWeekStart(DateOnly date)
    {
        var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    public static DateOnly GetWeekEnd(DateOnly weekStart) => weekStart.AddDays(6);
}
