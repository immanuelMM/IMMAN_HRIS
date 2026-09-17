namespace HRIS.Api.DTOs;

public record AttendanceRecordDto(int Id, DateOnly Date, DateTime? TimeIn, DateTime? TimeOut);

public record EmployeeQrTokenResponse(int EmployeeId, string Token);

public record ScanAttendanceRequest(string Token);

public record ScanAttendanceResponse(
    int EmployeeId,
    string EmployeeName,
    string? DepartmentName,
    bool HasPhoto,
    string Action,
    DateTime Time,
    string Message);

public record ProfileResponse(
    int Id,
    string FullName,
    string Email,
    string ContactNumber,
    string Address,
    DateOnly HireDate,
    string? CurrentDepartmentName,
    bool HasPhoto,
    List<EducationRecordDto> EducationRecords,
    List<EmploymentHistoryDto> EmploymentHistories,
    List<DepartmentHistoryDto> DepartmentHistories);
