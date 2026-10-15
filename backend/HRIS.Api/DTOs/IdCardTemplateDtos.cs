namespace HRIS.Api.DTOs;

public record SavedIdCardTemplateDto(
    int Id,
    string Name,
    string Design,
    string CardOrientation,
    string? SourceColor,
    string? SourceColorSecondary,
    string? SourceDepartmentName,
    DateTime CreatedAtUtc);

public record CreateSavedIdCardTemplateRequest(
    string Name,
    string Design,
    string? CardOrientation,
    int? SourceDepartmentId);

public record RenameSavedIdCardTemplateRequest(string Name);
