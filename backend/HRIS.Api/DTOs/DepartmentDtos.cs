namespace HRIS.Api.DTOs;

public record DepartmentDto(int Id, string Name, string? Description, int EmployeeCount);
public record CreateDepartmentRequest(string Name, string? Description);
public record UpdateDepartmentRequest(string Name, string? Description);
