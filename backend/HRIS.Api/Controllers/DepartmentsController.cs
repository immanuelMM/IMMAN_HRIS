using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly HrisDbContext _db;

    public DepartmentsController(HrisDbContext db)
    {
        _db = db;
    }

    private static readonly HashSet<string> ValidTemplates = new(StringComparer.OrdinalIgnoreCase) { "wave", "arch", "chevron", "stripe", "custom" };
    private static readonly HashSet<string> ValidOrientations = new(StringComparer.OrdinalIgnoreCase) { "horizontal", "vertical" };

    private static string NormalizeTemplate(string? template) =>
        template is not null && ValidTemplates.Contains(template) ? template.ToLowerInvariant() : "wave";

    private static string NormalizeOrientation(string? orientation) =>
        orientation is not null && ValidOrientations.Contains(orientation) ? orientation.ToLowerInvariant() : "horizontal";

    private static DepartmentDto ToDto(Department d) => new(
        d.Id,
        d.Name,
        d.Description,
        d.Employees.Count,
        d.TeamColor,
        d.TeamColorSecondary,
        d.IdCardTemplate,
        d.CardOrientation,
        d.LogoData is not null,
        d.Positions.Select(p => new DepartmentPositionDto(p.Id, p.Title)).OrderBy(p => p.Title).ToList());

    private IQueryable<Department> DepartmentQuery() => _db.Departments
        .Include(d => d.Employees)
        .Include(d => d.Positions);

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll()
    {
        var departments = await DepartmentQuery().ToListAsync();
        return Ok(departments.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> GetById(int id)
    {
        var department = await DepartmentQuery().FirstOrDefaultAsync(d => d.Id == id);
        return department is null ? NotFound() : Ok(ToDto(department));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> Create(CreateDepartmentRequest request)
    {
        var department = new Department
        {
            Name = request.Name,
            Description = request.Description,
            TeamColor = request.TeamColor,
            TeamColorSecondary = request.TeamColorSecondary,
            IdCardTemplate = NormalizeTemplate(request.IdCardTemplate),
            CardOrientation = NormalizeOrientation(request.CardOrientation),
        };
        _db.Departments.Add(department);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = department.Id },
            new DepartmentDto(department.Id, department.Name, department.Description, 0, department.TeamColor, department.TeamColorSecondary, department.IdCardTemplate, department.CardOrientation, false, new List<DepartmentPositionDto>()));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, UpdateDepartmentRequest request)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        department.Name = request.Name;
        department.Description = request.Description;
        department.TeamColor = request.TeamColor;
        department.TeamColorSecondary = request.TeamColorSecondary;
        department.IdCardTemplate = NormalizeTemplate(request.IdCardTemplate);
        department.CardOrientation = NormalizeOrientation(request.CardOrientation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        var hasEmployees = await _db.Employees.AnyAsync(e => e.CurrentDepartmentId == id);
        if (hasEmployees)
        {
            return Conflict(new { message = "Cannot delete a department with employees currently assigned to it." });
        }

        _db.Departments.Remove(department);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/logo")]
    public async Task<IActionResult> GetLogo(int id)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department?.LogoData is null)
        {
            return NotFound();
        }

        return File(department.LogoData, department.LogoContentType ?? "application/octet-stream");
    }

    [HttpPost("{id:int}/logo")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadLogo(int id, IFormFile? file)
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

        var department = await _db.Departments.FindAsync(id);
        if (department is null)
        {
            return NotFound();
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        department.LogoData = stream.ToArray();
        department.LogoContentType = file.ContentType;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}/logo")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteLogo(int id)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null)
        {
            return NotFound();
        }

        department.LogoData = null;
        department.LogoContentType = null;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Any signed-in user may read a design: employees need their own department's layout to render their ID.
    [HttpGet("{id:int}/id-card-design")]
    public async Task<ActionResult<IdCardDesignDto>> GetIdCardDesign(int id)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        return Ok(new IdCardDesignDto(department.IdCardDesign, department.CardOrientation));
    }

    [HttpPut("{id:int}/id-card-design")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> SaveIdCardDesign(int id, SaveIdCardDesignRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Design))
        {
            return BadRequest(new { message = "Design is required." });
        }

        try
        {
            using var _ = System.Text.Json.JsonDocument.Parse(request.Design);
        }
        catch (System.Text.Json.JsonException)
        {
            return BadRequest(new { message = "Design must be valid JSON." });
        }

        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        department.IdCardDesign = request.Design;
        department.IdCardTemplate = "custom";
        if (request.CardOrientation is not null)
        {
            department.CardOrientation = NormalizeOrientation(request.CardOrientation);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/positions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentPositionDto>> AddPosition(int id, AddDepartmentPositionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required." });
        }

        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        var position = new DepartmentPosition { DepartmentId = id, Title = request.Title.Trim() };
        _db.DepartmentPositions.Add(position);
        await _db.SaveChangesAsync();

        return Ok(new DepartmentPositionDto(position.Id, position.Title));
    }

    [HttpDelete("{id:int}/positions/{positionId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePosition(int id, int positionId)
    {
        var position = await _db.DepartmentPositions.FirstOrDefaultAsync(p => p.Id == positionId && p.DepartmentId == id);
        if (position is null) return NotFound();

        _db.DepartmentPositions.Remove(position);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
