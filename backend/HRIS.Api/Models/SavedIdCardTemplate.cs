namespace HRIS.Api.Models;

/// <summary>
/// A custom ID card layout saved to the shared library so any department can reuse it.
/// Applying one copies the design into the department; later edits don't affect the template.
/// </summary>
public class SavedIdCardTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>JSON layout from the ID card designer.</summary>
    public string Design { get; set; } = string.Empty;

    /// <summary>One of: "horizontal", "vertical".</summary>
    public string CardOrientation { get; set; } = "horizontal";

    /// <summary>Team colors of the department it was saved from, so it can be recolored when applied elsewhere.</summary>
    public string? SourceColor { get; set; }
    public string? SourceColorSecondary { get; set; }

    public int? SourceDepartmentId { get; set; }
    public string? SourceDepartmentName { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
