namespace HRIS.Api.Models;

public enum EducationLevel
{
    Secondary,
    Tertiary,
    Vocational
}

public class EducationRecord
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public EducationLevel Level { get; set; }
    public string SchoolName { get; set; } = string.Empty;
    public string? ProgramOrStrand { get; set; }
    public int? YearGraduated { get; set; }
    public string? Honors { get; set; }
}
