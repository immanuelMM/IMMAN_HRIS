using HRIS.Api.Models;

namespace HRIS.Api.DTOs;

public record BackupAccountDto(string Username, string PinHash);

public record BackupEducationRecordDto(
    int Id,
    EducationLevel Level,
    string SchoolName,
    string? ProgramOrStrand,
    int? YearGraduated,
    string? Honors);

public record BackupEmploymentHistoryDto(
    int Id,
    string CompanyName,
    string Position,
    DateOnly StartDate,
    DateOnly? EndDate,
    string? ReasonForLeaving);

public record BackupDepartmentHistoryDto(
    int Id,
    int DepartmentId,
    string Position,
    DateOnly StartDate,
    DateOnly? EndDate);

public record BackupEmployeeDto(
    int Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string? Suffix,
    DateOnly DateOfBirth,
    Gender Gender,
    CivilStatus CivilStatus,
    string Address,
    string ContactNumber,
    string Email,
    DateOnly HireDate,
    int? CurrentDepartmentId,
    byte[]? PhotoData,
    string? PhotoContentType,
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
    BackupAccountDto? Account,
    List<BackupEducationRecordDto> EducationRecords,
    List<BackupEmploymentHistoryDto> EmploymentHistories,
    List<BackupDepartmentHistoryDto> DepartmentHistories);

public record BackupDepartmentPositionDto(int Id, string Title);

public record BackupDepartmentDto(
    int Id,
    string Name,
    string? Description,
    string? TeamColor,
    string? TeamColorSecondary,
    string IdCardTemplate,
    string CardOrientation,
    byte[]? LogoData,
    string? LogoContentType,
    List<BackupDepartmentPositionDto> Positions,
    string? IdCardDesign = null);

public record BackupAttendanceRecordDto(int Id, int EmployeeId, DateOnly Date, DateTime? TimeIn, DateTime? TimeOut);

public record BackupData(
    DateTime ExportedAtUtc,
    List<BackupDepartmentDto> Departments,
    List<BackupEmployeeDto> Employees,
    List<BackupAttendanceRecordDto> AttendanceRecords);

public record ImportSummary(string Message, int Departments, int Employees, int AttendanceRecords);
