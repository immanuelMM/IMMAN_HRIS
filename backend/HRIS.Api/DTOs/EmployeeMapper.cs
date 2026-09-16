using HRIS.Api.Models;

namespace HRIS.Api.DTOs;

public static class EmployeeMapper
{
    public static EmployeeResponse ToResponse(Employee e)
    {
        return new EmployeeResponse(
            e.Id,
            e.FirstName,
            e.MiddleName,
            e.LastName,
            e.Suffix,
            e.FullName,
            e.DateOfBirth,
            e.Gender,
            e.CivilStatus,
            e.Address,
            e.ContactNumber,
            e.Email,
            e.HireDate,
            e.CurrentDepartmentId,
            e.CurrentDepartment?.Name,
            e.Account?.Username,
            e.EducationRecords.Select(r => new EducationRecordDto(r.Id, r.Level, r.SchoolName, r.ProgramOrStrand, r.YearGraduated, r.Honors)).ToList(),
            e.EmploymentHistories.Select(h => new EmploymentHistoryDto(h.Id, h.CompanyName, h.Position, h.StartDate, h.EndDate, h.ReasonForLeaving)).ToList(),
            e.DepartmentHistories.Select(d => new DepartmentHistoryDto(d.Id, d.DepartmentId, d.Department?.Name ?? string.Empty, d.Position, d.StartDate, d.EndDate)).ToList());
    }

    public static ProfileResponse ToProfile(Employee e)
    {
        return new ProfileResponse(
            e.Id,
            e.FullName,
            e.Email,
            e.ContactNumber,
            e.Address,
            e.HireDate,
            e.CurrentDepartment?.Name,
            e.EducationRecords.Select(r => new EducationRecordDto(r.Id, r.Level, r.SchoolName, r.ProgramOrStrand, r.YearGraduated, r.Honors)).ToList(),
            e.EmploymentHistories.Select(h => new EmploymentHistoryDto(h.Id, h.CompanyName, h.Position, h.StartDate, h.EndDate, h.ReasonForLeaving)).ToList(),
            e.DepartmentHistories.Select(d => new DepartmentHistoryDto(d.Id, d.DepartmentId, d.Department?.Name ?? string.Empty, d.Position, d.StartDate, d.EndDate)).ToList());
    }
}
