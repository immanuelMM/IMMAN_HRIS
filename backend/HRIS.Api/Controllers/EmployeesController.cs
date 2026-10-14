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
    private readonly EmployeeQrService _qr;
    private readonly PinDeliveryService _pinDelivery;

    public EmployeesController(
        HrisDbContext db,
        CredentialGenerator credentials,
        CredentialHasher hasher,
        EmployeeQrService qr,
        PinDeliveryService pinDelivery)
    {
        _db = db;
        _credentials = credentials;
        _hasher = hasher;
        _qr = qr;
        _pinDelivery = pinDelivery;
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
            ChurchLocal = request.ChurchLocal,
            ChurchDistrict = request.ChurchDistrict,
            ChurchProvince = request.ChurchProvince,
            ChurchRegion = request.ChurchRegion,
            ChurchPosition = request.ChurchPosition,
            ParentReligion = request.ParentReligion,
            SabbathDate = request.SabbathDate,
            SkillsExpertise = request.SkillsExpertise,
            HealthCondition = request.HealthCondition,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactNumber = request.EmergencyContactNumber,
            EmergencyContactAddress = request.EmergencyContactAddress,
            SssNumber = request.SssNumber,
            PhilHealthNumber = request.PhilHealthNumber,
            TinNumber = request.TinNumber,
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
        employee.ChurchLocal = request.ChurchLocal;
        employee.ChurchDistrict = request.ChurchDistrict;
        employee.ChurchProvince = request.ChurchProvince;
        employee.ChurchRegion = request.ChurchRegion;
        employee.ChurchPosition = request.ChurchPosition;
        employee.ParentReligion = request.ParentReligion;
        employee.SabbathDate = request.SabbathDate;
        employee.SkillsExpertise = request.SkillsExpertise;
        employee.HealthCondition = request.HealthCondition;
        employee.EmergencyContactName = request.EmergencyContactName;
        employee.EmergencyContactNumber = request.EmergencyContactNumber;
        employee.EmergencyContactAddress = request.EmergencyContactAddress;
        employee.SssNumber = request.SssNumber;
        employee.PhilHealthNumber = request.PhilHealthNumber;
        employee.TinNumber = request.TinNumber;

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
    public async Task<ActionResult<RegeneratePinResponse>> RegeneratePin(int id, RegeneratePinRequest? request)
    {
        var employee = await _db.Employees.Include(e => e.Account).FirstOrDefaultAsync(e => e.Id == id);
        if (employee?.Account is null) return NotFound();

        var pin = _credentials.GeneratePin();
        employee.Account.PinHash = _hasher.Hash(pin);
        await _db.SaveChangesAsync();

        var delivery = await _pinDelivery.DeliverAsync(request?.Channel, employee, employee.Account.Username, pin);

        return Ok(new RegeneratePinResponse(
            employee.Account.Username,
            pin,
            delivery.Channel,
            delivery.Destination,
            delivery.Delivered,
            delivery.Note));
    }

    [HttpGet("qr-tokens")]
    public async Task<ActionResult<List<EmployeeQrTokenResponse>>> GetAllQrTokens()
    {
        var ids = await _db.Employees.Select(e => e.Id).ToListAsync();
        var tokens = ids.Select(id => new EmployeeQrTokenResponse(id, _qr.GenerateToken(id))).ToList();
        return Ok(tokens);
    }

    [HttpGet("{id:int}/photo")]
    public async Task<IActionResult> GetPhoto(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee?.PhotoData is null)
        {
            return NotFound();
        }

        return File(employee.PhotoData, employee.PhotoContentType ?? "application/octet-stream");
    }

    [HttpPost("{id:int}/photo")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile? file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "File must be an image." });
        }

        if (file.Length > 5_000_000)
        {
            return BadRequest(new { message = "Image must be smaller than 5MB." });
        }

        var employee = await _db.Employees.FindAsync(id);
        if (employee is null)
        {
            return NotFound();
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        employee.PhotoData = stream.ToArray();
        employee.PhotoContentType = file.ContentType;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}/photo")]
    public async Task<IActionResult> DeletePhoto(int id)
    {
        var employee = await _db.Employees.FindAsync(id);
        if (employee is null)
        {
            return NotFound();
        }

        employee.PhotoData = null;
        employee.PhotoContentType = null;
        await _db.SaveChangesAsync();

        return NoContent();
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

    [HttpGet("{id:int}/export")]
    public async Task<IActionResult> Export(int id)
    {
        var employee = await EmployeeQuery().FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return NotFound();

        var bytes = EmployeeProfileDocumentGenerator.GenerateWord(employee);
        return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            $"{employee.FullName.Replace(' ', '-')}-profile.docx");
    }
}
