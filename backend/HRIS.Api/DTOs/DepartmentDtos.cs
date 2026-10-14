namespace HRIS.Api.DTOs;

public record DepartmentPositionDto(int Id, string Title);

public record DepartmentDto(
    int Id,
    string Name,
    string? Description,
    int EmployeeCount,
    string? TeamColor,
    string? TeamColorSecondary,
    string IdCardTemplate,
    string CardOrientation,
    bool HasLogo,
    List<DepartmentPositionDto> Positions);

public record CreateDepartmentRequest(string Name, string? Description, string? TeamColor, string? TeamColorSecondary, string? IdCardTemplate, string? CardOrientation);
public record UpdateDepartmentRequest(string Name, string? Description, string? TeamColor, string? TeamColorSecondary, string? IdCardTemplate, string? CardOrientation);
public record AddDepartmentPositionRequest(string Title);
