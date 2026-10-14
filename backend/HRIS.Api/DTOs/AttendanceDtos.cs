using HRIS.Api.Models;

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
    DateOnly DateOfBirth,
    Gender Gender,
    CivilStatus CivilStatus,
    int? CurrentDepartmentId,
    string? CurrentDepartmentName,
    string? CurrentDepartmentColor,
    string? CurrentDepartmentColorSecondary,
    bool CurrentDepartmentHasLogo,
    string CurrentDepartmentIdCardTemplate,
    string CurrentDepartmentCardOrientation,
    bool HasPhoto,
    string? ChurchLocal,
    string? ChurchDistrict,
    string? ChurchProvince,
    string? ChurchRegion,
    string? ChurchPosition,
    string? ParentReligion,
    DateOnly? SabbathDate,
    string? SkillsExpertise,
    string? HealthCondition,
    string? EmergencyContactName,
    string? EmergencyContactNumber,
    string? EmergencyContactAddress,
    string? SssNumber,
    string? PhilHealthNumber,
    string? TinNumber,
    List<EducationRecordDto> EducationRecords,
    List<EmploymentHistoryDto> EmploymentHistories,
    List<DepartmentHistoryDto> DepartmentHistories);
