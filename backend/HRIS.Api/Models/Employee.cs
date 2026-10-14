namespace HRIS.Api.Models;

public enum Gender
{
    Male,
    Female,
    Other
}

public enum CivilStatus
{
    Single,
    Married,
    Widowed,
    Separated
}

public class Employee
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? Suffix { get; set; }

    public DateOnly DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public CivilStatus CivilStatus { get; set; }

    public string Address { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public DateOnly HireDate { get; set; }

    public byte[]? PhotoData { get; set; }
    public string? PhotoContentType { get; set; }

    // Church affiliation
    public string? ChurchLocal { get; set; }
    public string? ChurchDistrict { get; set; }
    public string? ChurchProvince { get; set; }
    public string? ChurchRegion { get; set; }
    public string? ChurchPosition { get; set; }
    public string? ParentReligion { get; set; }
    public DateOnly? SabbathDate { get; set; }

    // Skills / health
    public string? SkillsExpertise { get; set; }
    public string? HealthCondition { get; set; }

    // Emergency contact
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactNumber { get; set; }
    public string? EmergencyContactAddress { get; set; }

    // Philippine government IDs
    public string? SssNumber { get; set; }
    public string? PhilHealthNumber { get; set; }
    public string? TinNumber { get; set; }

    public int? CurrentDepartmentId { get; set; }
    public Department? CurrentDepartment { get; set; }

    public EmployeeAccount? Account { get; set; }
    public ICollection<EducationRecord> EducationRecords { get; set; } = new List<EducationRecord>();
    public ICollection<EmploymentHistory> EmploymentHistories { get; set; } = new List<EmploymentHistory>();
    public ICollection<DepartmentHistory> DepartmentHistories { get; set; } = new List<DepartmentHistory>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();

    public string FullName => string.Join(" ", new[] { FirstName, MiddleName, LastName, Suffix }
        .Where(s => !string.IsNullOrWhiteSpace(s)));
}
