using System.Text.Json;
using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

/// <summary>Shared library of custom ID card designs that any department can adopt.</summary>
[ApiController]
[Route("api/id-card-templates")]
[Authorize(Roles = "Admin")]
public class IdCardTemplatesController : ControllerBase
{
    private readonly HrisDbContext _db;

    public IdCardTemplatesController(HrisDbContext db)
    {
        _db = db;
    }

    private static SavedIdCardTemplateDto ToDto(SavedIdCardTemplate t) => new(
        t.Id,
        t.Name,
        t.Design,
        t.CardOrientation,
        t.SourceColor,
        t.SourceColorSecondary,
        t.SourceDepartmentName,
        t.CreatedAtUtc);

    [HttpGet]
    public async Task<ActionResult<List<SavedIdCardTemplateDto>>> GetAll()
    {
        var templates = await _db.SavedIdCardTemplates.OrderBy(t => t.Name).ToListAsync();
        return Ok(templates.Select(ToDto).ToList());
    }

    [HttpPost]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<SavedIdCardTemplateDto>> Create(CreateSavedIdCardTemplateRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            return BadRequest(new { message = "Template name is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Design))
        {
            return BadRequest(new { message = "Design is required." });
        }

        try
        {
            using var _ = JsonDocument.Parse(request.Design);
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "Design must be valid JSON." });
        }

        if (await _db.SavedIdCardTemplates.AnyAsync(t => t.Name.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = $"A template named \"{name}\" already exists." });
        }

        Department? source = request.SourceDepartmentId is int deptId ? await _db.Departments.FindAsync(deptId) : null;

        var template = new SavedIdCardTemplate
        {
            Name = name,
            Design = request.Design,
            CardOrientation = request.CardOrientation == "vertical" ? "vertical" : "horizontal",
            SourceColor = source?.TeamColor,
            SourceColorSecondary = source?.TeamColorSecondary,
            SourceDepartmentId = source?.Id,
            SourceDepartmentName = source?.Name,
        };
        _db.SavedIdCardTemplates.Add(template);
        await _db.SaveChangesAsync();
        return Ok(ToDto(template));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Rename(int id, RenameSavedIdCardTemplateRequest request)
    {
        var name = request.Name?.Trim() ?? string.Empty;
        if (name.Length == 0)
        {
            return BadRequest(new { message = "Template name is required." });
        }

        var template = await _db.SavedIdCardTemplates.FindAsync(id);
        if (template is null) return NotFound();

        if (await _db.SavedIdCardTemplates.AnyAsync(t => t.Id != id && t.Name.ToLower() == name.ToLower()))
        {
            return Conflict(new { message = $"A template named \"{name}\" already exists." });
        }

        template.Name = name;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var template = await _db.SavedIdCardTemplates.FindAsync(id);
        if (template is null) return NotFound();

        // Departments hold their own copy of the design, so removing it here doesn't change any ID.
        _db.SavedIdCardTemplates.Remove(template);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
