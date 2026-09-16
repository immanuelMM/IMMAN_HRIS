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
    BackupAccountDto? Account,
    List<BackupEducationRecordDto> EducationRecords,
    List<BackupEmploymentHistoryDto> EmploymentHistories,
    List<BackupDepartmentHistoryDto> DepartmentHistories);

public record BackupDepartmentDto(int Id, string Name, string? Description);

public record BackupAttendanceRecordDto(int Id, int EmployeeId, DateOnly Date, DateTime? TimeIn, DateTime? TimeOut);

public record BackupData(
    DateTime ExportedAtUtc,
    List<BackupDepartmentDto> Departments,
    List<BackupEmployeeDto> Employees,
    List<BackupAttendanceRecordDto> AttendanceRecords);

public record ImportSummary(string Message, int Departments, int Employees, int AttendanceRecords);
