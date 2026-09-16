namespace HRIS.Api.Models;

public class AttendanceRecord
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public DateOnly Date { get; set; }
    public DateTime? TimeIn { get; set; }
    public DateTime? TimeOut { get; set; }
}
