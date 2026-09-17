using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/admin/backup")]
[Authorize(Roles = "Admin")]
public class AdminBackupController : ControllerBase
{
    private readonly HrisDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public AdminBackupController(HrisDbContext db)
    {
        _db = db;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var departments = await _db.Departments
            .Select(d => new BackupDepartmentDto(d.Id, d.Name, d.Description))
            .ToListAsync();

        var employees = await _db.Employees
            .Include(e => e.Account)
            .Include(e => e.EducationRecords)
            .Include(e => e.EmploymentHistories)
            .Include(e => e.DepartmentHistories)
            .ToListAsync();

        var backupEmployees = employees.Select(e => new BackupEmployeeDto(
            e.Id,
            e.FirstName,
            e.MiddleName,
            e.LastName,
            e.Suffix,
            e.DateOfBirth,
            e.Gender,
            e.CivilStatus,
            e.Address,
            e.ContactNumber,
            e.Email,
            e.HireDate,
            e.CurrentDepartmentId,
            e.PhotoData,
            e.PhotoContentType,
            e.Account is null ? null : new BackupAccountDto(e.Account.Username, e.Account.PinHash),
            e.EducationRecords.Select(r => new BackupEducationRecordDto(r.Id, r.Level, r.SchoolName, r.ProgramOrStrand, r.YearGraduated, r.Honors)).ToList(),
            e.EmploymentHistories.Select(h => new BackupEmploymentHistoryDto(h.Id, h.CompanyName, h.Position, h.StartDate, h.EndDate, h.ReasonForLeaving)).ToList(),
            e.DepartmentHistories.Select(d => new BackupDepartmentHistoryDto(d.Id, d.DepartmentId, d.Position, d.StartDate, d.EndDate)).ToList()))
            .ToList();

        var attendance = await _db.AttendanceRecords
            .Select(a => new BackupAttendanceRecordDto(a.Id, a.EmployeeId, a.Date, a.TimeIn, a.TimeOut))
            .ToListAsync();

        var backup = new BackupData(DateTime.UtcNow, departments, backupEmployees, attendance);
        var json = JsonSerializer.Serialize(backup, JsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);

        return File(bytes, "application/json", $"hris-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json");
    }

    [HttpPost("import")]
    [RequestSizeLimit(50_000_000)]
    public async Task<ActionResult<ImportSummary>> Import(IFormFile? file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        BackupData? backup;
        try
        {
            using var stream = file.OpenReadStream();
            backup = await JsonSerializer.DeserializeAsync<BackupData>(stream, JsonOptions);
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "That file isn't a valid HRIS backup (couldn't parse JSON)." });
        }

        if (backup is null)
        {
            return BadRequest(new { message = "That file isn't a valid HRIS backup." });
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        // Wipe existing company data (in FK-safe order). Admin login accounts are left untouched.
        // Table names are double-quoted: Postgres folds unquoted identifiers to
        // lowercase, but EF Core's migrations create case-preserved (quoted) names.
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"AttendanceRecords\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"DepartmentHistories\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"EmploymentHistories\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"EducationRecords\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"EmployeeAccounts\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"Employees\"");
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM \"Departments\"");

        foreach (var d in backup.Departments)
        {
            _db.Departments.Add(new Department { Id = d.Id, Name = d.Name, Description = d.Description });
        }
        await _db.SaveChangesAsync();

        foreach (var e in backup.Employees)
        {
            _db.Employees.Add(new Employee
            {
                Id = e.Id,
                FirstName = e.FirstName,
                MiddleName = e.MiddleName,
                LastName = e.LastName,
                Suffix = e.Suffix,
                DateOfBirth = e.DateOfBirth,
                Gender = e.Gender,
                CivilStatus = e.CivilStatus,
                Address = e.Address,
                ContactNumber = e.ContactNumber,
                Email = e.Email,
                HireDate = e.HireDate,
                CurrentDepartmentId = e.CurrentDepartmentId,
                PhotoData = e.PhotoData,
                PhotoContentType = e.PhotoContentType,
            });

            if (e.Account is not null)
            {
                _db.EmployeeAccounts.Add(new EmployeeAccount
                {
                    EmployeeId = e.Id,
                    Username = e.Account.Username,
                    PinHash = e.Account.PinHash,
                });
            }

            foreach (var r in e.EducationRecords)
            {
                _db.EducationRecords.Add(new EducationRecord
                {
                    Id = r.Id,
                    EmployeeId = e.Id,
                    Level = r.Level,
                    SchoolName = r.SchoolName,
                    ProgramOrStrand = r.ProgramOrStrand,
                    YearGraduated = r.YearGraduated,
                    Honors = r.Honors,
                });
            }

            foreach (var h in e.EmploymentHistories)
            {
                _db.EmploymentHistories.Add(new EmploymentHistory
                {
                    Id = h.Id,
                    EmployeeId = e.Id,
                    CompanyName = h.CompanyName,
                    Position = h.Position,
                    StartDate = h.StartDate,
                    EndDate = h.EndDate,
                    ReasonForLeaving = h.ReasonForLeaving,
                });
            }

            foreach (var dh in e.DepartmentHistories)
            {
                _db.DepartmentHistories.Add(new DepartmentHistory
                {
                    Id = dh.Id,
                    EmployeeId = e.Id,
                    DepartmentId = dh.DepartmentId,
                    Position = dh.Position,
                    StartDate = dh.StartDate,
                    EndDate = dh.EndDate,
                });
            }
        }
        await _db.SaveChangesAsync();

        foreach (var a in backup.AttendanceRecords)
        {
            _db.AttendanceRecords.Add(new AttendanceRecord
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                Date = a.Date,
                TimeIn = a.TimeIn,
                TimeOut = a.TimeOut,
            });
        }
        await _db.SaveChangesAsync();

        // We just inserted rows with explicit Ids (to preserve relationships from the
        // backup), bypassing each table's auto-increment sequence. Postgres doesn't
        // notice this on its own — its sequences only advance via nextval(), so without
        // this they'd stay wherever they were and the next normal insert (e.g. creating
        // a new employee) would collide with an Id that already exists.
        foreach (var table in new[] { "Departments", "Employees", "EducationRecords", "EmploymentHistories", "DepartmentHistories", "AttendanceRecords" })
        {
            // `table` only ever comes from the fixed literal array above — not user input.
#pragma warning disable EF1002
            await _db.Database.ExecuteSqlRawAsync(
                $"SELECT setval(pg_get_serial_sequence('\"{table}\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"{table}\"), 1), true)");
#pragma warning restore EF1002
        }

        await transaction.CommitAsync();

        return Ok(new ImportSummary(
            "Backup imported successfully.",
            backup.Departments.Count,
            backup.Employees.Count,
            backup.AttendanceRecords.Count));
    }
}
