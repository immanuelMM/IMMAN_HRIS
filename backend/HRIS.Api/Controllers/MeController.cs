using System.Security.Claims;
using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
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
        var today = DateOnly.FromDateTime(DateTime.Now);
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
            TimeIn = DateTime.Now,
        };
        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new AttendanceRecordDto(record.Id, record.Date, record.TimeIn, record.TimeOut));
    }

    [HttpPost("time-out")]
    public async Task<ActionResult<AttendanceRecordDto>> TimeOut()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
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

        record.TimeOut = DateTime.Now;
        await _db.SaveChangesAsync();

        return Ok(new AttendanceRecordDto(record.Id, record.Date, record.TimeIn, record.TimeOut));
    }
}
