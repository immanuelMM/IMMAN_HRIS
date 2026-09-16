namespace HRIS.Api.Models;

public class DepartmentHistory
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Position { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
