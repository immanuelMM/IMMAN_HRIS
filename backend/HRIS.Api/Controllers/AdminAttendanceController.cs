using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/admin/attendance")]
[Authorize(Roles = "Admin")]
public class AdminAttendanceController : ControllerBase
{
    private readonly HrisDbContext _db;

    public AdminAttendanceController(HrisDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<AttendanceMonitoringResponse>> Get(int? employeeId, string? startDate, string? endDate)
    {
        var response = await BuildResponseAsync(employeeId, startDate, endDate);
        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<AdminAttendanceRecordDto>> Create(CreateAttendanceRecordRequest request)
    {
        var employee = await _db.Employees.FindAsync(request.EmployeeId);
        if (employee is null)
        {
            return BadRequest(new { message = "Employee not found." });
        }

        if (request.TimeIn is null)
        {
            return BadRequest(new { message = "Time In is required." });
        }

        var exists = await _db.AttendanceRecords
            .AnyAsync(a => a.EmployeeId == request.EmployeeId && a.Date == request.Date);
        if (exists)
        {
            return Conflict(new { message = "An attendance record already exists for this employee on this date." });
        }

        var record = new AttendanceRecord
        {
            EmployeeId = request.EmployeeId,
            Date = request.Date,
            TimeIn = request.TimeIn,
            TimeOut = request.TimeOut,
        };
        _db.AttendanceRecords.Add(record);
        await _db.SaveChangesAsync();

        return Ok(new AdminAttendanceRecordDto(
            record.Id,
            record.EmployeeId,
            employee.FullName,
            record.Date,
            record.TimeIn,
            record.TimeOut,
            AttendanceCalculator.ComputeDailyHours(record.TimeIn, record.TimeOut)));
    }

    [HttpPost("{id:int}/adjust")]
    public async Task<ActionResult<AdminAttendanceRecordDto>> AdjustTime(int id, AdjustAttendanceTimeRequest request)
    {
        var record = await _db.AttendanceRecords.Include(a => a.Employee).FirstOrDefaultAsync(a => a.Id == id);
        if (record is null)
        {
            return NotFound();
        }

        var defaultBase = record.Date.ToDateTime(new TimeOnly(8, 0));

        switch (request.Field)
        {
            case "timeIn":
                record.TimeIn = (record.TimeIn ?? defaultBase).AddMinutes(request.Minutes);
                break;
            case "timeOut":
                record.TimeOut = (record.TimeOut ?? record.TimeIn ?? defaultBase).AddMinutes(request.Minutes);
                break;
            default:
                return BadRequest(new { message = "Field must be 'timeIn' or 'timeOut'." });
        }

        await _db.SaveChangesAsync();

        return Ok(new AdminAttendanceRecordDto(
            record.Id,
            record.EmployeeId,
            record.Employee!.FullName,
            record.Date,
            record.TimeIn,
            record.TimeOut,
            AttendanceCalculator.ComputeDailyHours(record.TimeIn, record.TimeOut)));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _db.AttendanceRecords.FindAsync(id);
        if (record is null)
        {
            return NotFound();
        }

        _db.AttendanceRecords.Remove(record);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(string format, int? employeeId, string? startDate, string? endDate)
    {
        var response = await BuildResponseAsync(employeeId, startDate, endDate);
        var (rangeStart, rangeEnd) = ResolveRange(startDate, endDate);

        if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            var bytes = AttendanceReportGenerator.GeneratePdf(response, rangeStart, rangeEnd);
            return File(bytes, "application/pdf", $"attendance-report-{rangeStart:yyyyMMdd}-{rangeEnd:yyyyMMdd}.pdf");
        }

        if (string.Equals(format, "excel", StringComparison.OrdinalIgnoreCase))
        {
            var bytes = AttendanceReportGenerator.GenerateExcel(response, rangeStart, rangeEnd);
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"attendance-report-{rangeStart:yyyyMMdd}-{rangeEnd:yyyyMMdd}.xlsx");
        }

        return BadRequest(new { message = "Unsupported format. Use 'pdf' or 'excel'." });
    }

    private static (DateOnly Start, DateOnly End) ResolveRange(string? startDate, string? endDate)
    {
        if (DateOnly.TryParse(startDate, out var start) && DateOnly.TryParse(endDate, out var end))
        {
            return (start, end);
        }

        var today = PhilippineTime.Today;
        var weekStart = AttendanceCalculator.GetWeekStart(today);
        return (weekStart, AttendanceCalculator.GetWeekEnd(weekStart));
    }

    private async Task<AttendanceMonitoringResponse> BuildResponseAsync(int? employeeId, string? startDate, string? endDate)
    {
        var (rangeStart, rangeEnd) = ResolveRange(startDate, endDate);

        var query = _db.AttendanceRecords
            .Include(a => a.Employee)
            .Where(a => a.Date >= rangeStart && a.Date <= rangeEnd);

        if (employeeId is not null)
        {
            query = query.Where(a => a.EmployeeId == employeeId);
        }

        var rows = await query
            .OrderBy(a => a.Employee!.LastName).ThenBy(a => a.Employee!.FirstName).ThenBy(a => a.Date)
            .ToListAsync();

        var records = rows.Select(r => new AdminAttendanceRecordDto(
            r.Id,
            r.EmployeeId,
            r.Employee!.FullName,
            r.Date,
            r.TimeIn,
            r.TimeOut,
            AttendanceCalculator.ComputeDailyHours(r.TimeIn, r.TimeOut))).ToList();

        var weeklySummaries = records
            .GroupBy(r => (r.EmployeeId, r.EmployeeName, WeekStart: AttendanceCalculator.GetWeekStart(r.Date)))
            .Select(g => new WeeklySummaryDto(
                g.Key.EmployeeId,
                g.Key.EmployeeName,
                g.Key.WeekStart,
                AttendanceCalculator.GetWeekEnd(g.Key.WeekStart),
                Math.Round(g.Sum(r => r.DailyHours ?? 0), 2)))
            .OrderBy(s => s.EmployeeName).ThenBy(s => s.WeekStart)
            .ToList();

        return new AttendanceMonitoringResponse(records, weeklySummaries);
    }
}
