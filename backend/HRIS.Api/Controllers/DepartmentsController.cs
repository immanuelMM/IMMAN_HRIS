using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize(Roles = "Admin")]
public class DepartmentsController : ControllerBase
{
    private readonly HrisDbContext _db;

    public DepartmentsController(HrisDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll()
    {
        var departments = await _db.Departments
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description, d.Employees.Count))
            .ToListAsync();
        return Ok(departments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> GetById(int id)
    {
        var department = await _db.Departments
            .Where(d => d.Id == id)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description, d.Employees.Count))
            .FirstOrDefaultAsync();

        return department is null ? NotFound() : Ok(department);
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create(CreateDepartmentRequest request)
    {
        var department = new Department { Name = request.Name, Description = request.Description };
        _db.Departments.Add(department);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = department.Id }, new DepartmentDto(department.Id, department.Name, department.Description, 0));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDepartmentRequest request)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null) return NotFound();

        department.Name = request.Name;
        department.Description = request.Description;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
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
}
