using System.Security.Claims;
using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Roles = "Employee")]
public class MeController : ControllerBase
{
    private readonly HrisDbContext _db;

    public MeController(HrisDbContext db)
    {
        _db = db;
    }

    private int CurrentEmployeeId => int.Parse(User.FindFirstValue("employeeId")!);

    [HttpGet("profile")]
    public async Task<ActionResult<ProfileResponse>> GetProfile()
    {
        var employee = await _db.Employees
            .Include(e => e.CurrentDepartment)
            .Include(e => e.EducationRecords)
            .Include(e => e.EmploymentHistories)
            .Include(e => e.DepartmentHistories).ThenInclude(dh => dh.Department)
            .FirstOrDefaultAsync(e => e.Id == CurrentEmployeeId);

        return employee is null ? NotFound() : Ok(EmployeeMapper.ToProfile(employee));
    }

    [HttpGet("photo")]
    public async Task<IActionResult> GetPhoto()
    {
        var employee = await _db.Employees.FindAsync(CurrentEmployeeId);
        if (employee?.PhotoData is null)
        {
            return NotFound();
        }

        return File(employee.PhotoData, employee.PhotoContentType ?? "application/octet-stream");
    }

    [HttpPost("photo")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadPhoto(IFormFile? file)
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

        var employee = await _db.Employees.FindAsync(CurrentEmployeeId);
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

    [HttpDelete("photo")]
    public async Task<IActionResult> DeletePhoto()
    {
        var employee = await _db.Employees.FindAsync(CurrentEmployeeId);
        if (employee is null)
        {
            return NotFound();
        }

        employee.PhotoData = null;
        employee.PhotoContentType = null;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<List<AttendanceRecordDto>>> GetAttendance()
    {
        var records = await _db.AttendanceRecords
            .Where(a => a.EmployeeId == CurrentEmployeeId)
            .OrderByDescending(a => a.Date)
            .Select(a => new AttendanceRecordDto(a.Id, a.Date, a.TimeIn, a.TimeOut))
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost("time-in")]
    public async Task<ActionResult<AttendanceRecordDto>> TimeIn()
    {
        var today = PhilippineTime.Today;
        var existing = await _db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.EmployeeId == CurrentEmployeeId && a.Date == today);

        if (existing is not null)
        {
            return Conflict(new { message = "You have already timed in today." });
        }

        var record = new AttendanceRecord
        {
            EmployeeId = CurrentEmployeeId,
            Date = today,
            TimeIn = PhilippineTime.Now,
        };
        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new AttendanceRecordDto(record.Id, record.Date, record.TimeIn, record.TimeOut));
    }

    [HttpPost("time-out")]
    public async Task<ActionResult<AttendanceRecordDto>> TimeOut()
    {
        var today = PhilippineTime.Today;
        var record = await _db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.EmployeeId == CurrentEmployeeId && a.Date == today);

        if (record is null || record.TimeIn is null)
        {
            return BadRequest(new { message = "You must time in before you can time out." });
        }

        if (record.TimeOut is not null)
        {
            return Conflict(new { message = "You have already timed out today." });
        }

        record.TimeOut = PhilippineTime.Now;
        await _db.SaveChangesAsync();

        return Ok(new AttendanceRecordDto(record.Id, record.Date, record.TimeIn, record.TimeOut));
    }
}
