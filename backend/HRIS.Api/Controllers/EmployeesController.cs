using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize(Roles = "Admin")]
public class EmployeesController : ControllerBase
{
    private readonly HrisDbContext _db;
    private readonly CredentialGenerator _credentials;
    private readonly CredentialHasher _hasher;

    public EmployeesController(HrisDbContext db, CredentialGenerator credentials, CredentialHasher hasher)
    {
        _db = db;
        _credentials = credentials;
        _hasher = hasher;
    }

    private IQueryable<Employee> EmployeeQuery() => _db.Employees
        .Include(e => e.CurrentDepartment)
        .Include(e => e.Account)
        .Include(e => e.EducationRecords)
        .Include(e => e.EmploymentHistories)
        .Include(e => e.DepartmentHistories).ThenInclude(dh => dh.Department);

    [HttpGet]
    public async Task<ActionResult<List<EmployeeResponse>>> GetAll()
    {
        var employees = await EmployeeQuery().OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ToListAsync();
        return Ok(employees.Select(EmployeeMapper.ToResponse).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeResponse>> GetById(int id)
    {
        var employee = await EmployeeQuery().FirstOrDefaultAsync(e => e.Id == id);
        return employee is null ? NotFound() : Ok(EmployeeMapper.ToResponse(employee));
    }

    [HttpPost]
    public async Task<ActionResult<CreateEmployeeResponse>> Create(CreateEmployeeRequest request)
    {
        var department = await _db.Departments.FindAsync(request.DepartmentId);
        if (department is null)
        {
            return BadRequest(new { message = "Department not found." });
        }

        var employee = new Employee
        {
            FirstName = request.FirstName,
            MiddleName = request.MiddleName,
            LastName = request.LastName,
            Suffix = request.Suffix,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            CivilStatus = request.CivilStatus,
            Address = request.Address,
            ContactNumber = request.ContactNumber,
            Email = request.Email,
            HireDate = request.HireDate,
            CurrentDepartmentId = request.DepartmentId,
        };

        foreach (var edu in request.EducationRecords)
        {
            employee.EducationRecords.Add(new EducationRecord
            {
                Level = edu.Level,
                SchoolName = edu.SchoolName,
                ProgramOrStrand = edu.ProgramOrStrand,
                YearGraduated = edu.YearGraduated,
                Honors = edu.Honors,
            });
        }

        foreach (var job in request.EmploymentHistories)
        {
            employee.EmploymentHistories.Add(new EmploymentHistory
            {
                CompanyName = job.CompanyName,
                Position = job.Position,
                StartDate = job.StartDate,
                EndDate = job.EndDate,
                ReasonForLeaving = job.ReasonForLeaving,
            });
        }

        employee.DepartmentHistories.Add(new DepartmentHistory
        {
            DepartmentId = request.DepartmentId,
            Position = request.Position,
            StartDate = request.HireDate,
            EndDate = null,
        });

        var username = await _credentials.GenerateUsernameAsync(request.FirstName, request.LastName);
        var pin = _credentials.GeneratePin();
        employee.Account = new EmployeeAccount
        {
            Username = username,
            PinHash = _hasher.Hash(pin),
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        await _db.Entry(employee).Reference(e => e.CurrentDepartment).LoadAsync();
        await _db.Entry(employee).Collection(e => e.DepartmentHistories).Query().Include(dh => dh.Department).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = employee.Id },
            new CreateEmployeeResponse(EmployeeMapper.ToResponse(employee), username, pin));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EmployeeResponse>> Update(int id, UpdateEmployeeRequest request)
    {
        var employee = await EmployeeQuery().FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return NotFound();

        employee.FirstName = request.FirstName;
        employee.MiddleName = request.MiddleName;
        employee.LastName = request.LastName;
        employee.Suffix = request.Suffix;
        employee.DateOfBirth = request.DateOfBirth;
        employee.Gender = request.Gender;
        employee.CivilStatus = request.CivilStatus;
        employee.Address = request.Address;
        employee.ContactNumber = request.ContactNumber;
        employee.Email = request.Email;
        employee.HireDate = request.HireDate;

        _db.EducationRecords.RemoveRange(employee.EducationRecords);
        employee.EducationRecords.Clear();
        foreach (var edu in request.EducationRecords)
        {
            employee.EducationRecords.Add(new EducationRecord
            {
                Level = edu.Level,
                SchoolName = edu.SchoolName,
                ProgramOrStrand = edu.ProgramOrStrand,
                YearGraduated = edu.YearGraduated,
                Honors = edu.Honors,
            });
        }

        _db.EmploymentHistories.RemoveRange(employee.EmploymentHistories);
        employee.EmploymentHistories.Clear();
        foreach (var job in request.EmploymentHistories)
        {
            employee.EmploymentHistories.Add(new EmploymentHistory
            {
                CompanyName = job.CompanyName,
                Position = job.Position,
                StartDate = job.StartDate,
                EndDate = job.EndDate,
                ReasonForLeaving = job.ReasonForLeaving,
            });
        }

        await _db.SaveChangesAsync();
        return Ok(EmployeeMapper.ToResponse(employee));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null) return NotFound();

        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/regenerate-pin")]
    public async Task<ActionResult<RegeneratePinResponse>> RegeneratePin(int id)
    {
        var account = await _db.EmployeeAccounts.FirstOrDefaultAsync(a => a.EmployeeId == id);
        if (account is null) return NotFound();

        var pin = _credentials.GeneratePin();
        account.PinHash = _hasher.Hash(pin);
        await _db.SaveChangesAsync();

        return Ok(new RegeneratePinResponse(account.Username, pin));
    }

    [HttpPost("{id:int}/department")]
    public async Task<ActionResult<EmployeeResponse>> TransferDepartment(int id, DepartmentTransferRequest request)
    {
        var employee = await EmployeeQuery().FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return NotFound();

        var department = await _db.Departments.FindAsync(request.DepartmentId);
        if (department is null) return BadRequest(new { message = "Department not found." });

        var openHistory = employee.DepartmentHistories.FirstOrDefault(dh => dh.EndDate == null);
        if (openHistory is not null)
        {
            openHistory.EndDate = request.EffectiveDate;
        }

        employee.DepartmentHistories.Add(new DepartmentHistory
        {
            DepartmentId = request.DepartmentId,
            Position = request.Position,
            StartDate = request.EffectiveDate,
            EndDate = null,
        });
        employee.CurrentDepartmentId = request.DepartmentId;

        await _db.SaveChangesAsync();

        var refreshed = await EmployeeQuery().FirstAsync(e => e.Id == id);
        return Ok(EmployeeMapper.ToResponse(refreshed));
    }
}
