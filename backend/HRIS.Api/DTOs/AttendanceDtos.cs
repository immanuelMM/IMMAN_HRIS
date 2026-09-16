namespace HRIS.Api.DTOs;

public record AttendanceRecordDto(int Id, DateOnly Date, DateTime? TimeIn, DateTime? TimeOut);

public record ProfileResponse(
    int Id,
    string FullName,
    string Email,
    string ContactNumber,
    string Address,
    DateOnly HireDate,
    string? CurrentDepartmentName,
    List<EducationRecordDto> EducationRecords,
    List<EmploymentHistoryDto> EmploymentHistories,
    List<DepartmentHistoryDto> DepartmentHistories);
