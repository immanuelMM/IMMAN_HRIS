using HRIS.Api.Models;

namespace HRIS.Api.DTOs;

public record EducationRecordDto(int Id, EducationLevel Level, string SchoolName, string? ProgramOrStrand, int? YearGraduated, string? Honors);
public record EducationRecordInput(EducationLevel Level, string SchoolName, string? ProgramOrStrand, int? YearGraduated, string? Honors);

public record EmploymentHistoryDto(int Id, string CompanyName, string Position, DateOnly StartDate, DateOnly? EndDate, string? ReasonForLeaving);
public record EmploymentHistoryInput(string CompanyName, string Position, DateOnly StartDate, DateOnly? EndDate, string? ReasonForLeaving);

public record DepartmentHistoryDto(int Id, int DepartmentId, string DepartmentName, string Position, DateOnly StartDate, DateOnly? EndDate);

public record CreateEmployeeRequest(
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
    int DepartmentId,
    string Position,
    List<EducationRecordInput> EducationRecords,
    List<EmploymentHistoryInput> EmploymentHistories);

public record UpdateEmployeeRequest(
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
    List<EducationRecordInput> EducationRecords,
    List<EmploymentHistoryInput> EmploymentHistories);

public record DepartmentTransferRequest(int DepartmentId, string Position, DateOnly EffectiveDate);

public record EmployeeResponse(
    int Id,
    string FirstName,
    string? MiddleName,
    string LastName,
    string? Suffix,
    string FullName,
    DateOnly DateOfBirth,
    Gender Gender,
    CivilStatus CivilStatus,
    string Address,
    string ContactNumber,
    string Email,
    DateOnly HireDate,
    int? CurrentDepartmentId,
    string? CurrentDepartmentName,
    string? Username,
    bool HasPhoto,
    List<EducationRecordDto> EducationRecords,
    List<EmploymentHistoryDto> EmploymentHistories,
    List<DepartmentHistoryDto> DepartmentHistories);

public record CreateEmployeeResponse(EmployeeResponse Employee, string GeneratedUsername, string GeneratedPin);

public record RegeneratePinResponse(string Username, string NewPin);
