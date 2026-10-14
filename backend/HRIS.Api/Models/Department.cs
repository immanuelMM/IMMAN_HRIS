namespace HRIS.Api.Models;

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public string? TeamColor { get; set; }
    public string? TeamColorSecondary { get; set; }
    public byte[]? LogoData { get; set; }
    public string? LogoContentType { get; set; }

    /// <summary>One of: "wave", "arch", "chevron", "stripe". See IdCardModal/PrintIdCardsPage on the frontend.</summary>
    public string IdCardTemplate { get; set; } = "wave";

    /// <summary>One of: "horizontal", "vertical".</summary>
    public string CardOrientation { get; set; } = "horizontal";

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<DepartmentHistory> DepartmentHistories { get; set; } = new List<DepartmentHistory>();
    public ICollection<DepartmentPosition> Positions { get; set; } = new List<DepartmentPosition>();
}
