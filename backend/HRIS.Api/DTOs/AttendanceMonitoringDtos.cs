namespace HRIS.Api.DTOs;

public record AdminAttendanceRecordDto(
    int Id,
    int EmployeeId,
    string EmployeeName,
    DateOnly Date,
    DateTime? TimeIn,
    DateTime? TimeOut,
    double? DailyHours);

public record CreateAttendanceRecordRequest(
    int EmployeeId,
    DateOnly Date,
    DateTime? TimeIn,
    DateTime? TimeOut);

public record AdjustAttendanceTimeRequest(string Field, int Minutes);

public record WeeklySummaryDto(
    int EmployeeId,
    string EmployeeName,
    DateOnly WeekStart,
    DateOnly WeekEnd,
    double TotalHours);

public record AttendanceMonitoringResponse(
    List<AdminAttendanceRecordDto> Records,
    List<WeeklySummaryDto> WeeklySummaries);
