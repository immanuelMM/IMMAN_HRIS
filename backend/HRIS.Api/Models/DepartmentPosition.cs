namespace HRIS.Api.Models;

/// <summary>
/// A named position available within a department (e.g. "Line Leader" under
/// "1000ML (HW)"). Purely a suggestion list for admin forms — an employee's
/// actual Position on their DepartmentHistory stays a free-text field, so
/// renaming or removing one of these never touches historical records.
/// </summary>
public class DepartmentPosition
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    public string Title { get; set; } = string.Empty;
}
