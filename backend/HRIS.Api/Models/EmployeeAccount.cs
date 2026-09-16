namespace HRIS.Api.Models;

public class EmployeeAccount
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public string Username { get; set; } = string.Empty;
    public string PinHash { get; set; } = string.Empty;
}
