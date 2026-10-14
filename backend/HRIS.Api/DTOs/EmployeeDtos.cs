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
    string? CurrentDepartmentColor,
    string? CurrentDepartmentColorSecondary,
    bool CurrentDepartmentHasLogo,
    string CurrentDepartmentIdCardTemplate,
    string CurrentDepartmentCardOrientation,
    string? Username,
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

public record CreateEmployeeResponse(EmployeeResponse Employee, string GeneratedUsername, string GeneratedPin);

public record RegeneratePinRequest(string? Channel);

public record RegeneratePinResponse(
    string Username,
    string NewPin,
    string? DeliveryChannel,
    string? DeliveryDestination,
    bool Delivered,
    string DeliveryNote);
