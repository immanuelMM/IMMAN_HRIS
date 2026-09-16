using HRIS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Data;

public class HrisDbContext : DbContext
{
    public HrisDbContext(DbContextOptions<HrisDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<EmploymentHistory> EmploymentHistories => Set<EmploymentHistory>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<DepartmentHistory> DepartmentHistories => Set<DepartmentHistory>();
    public DbSet<EmployeeAccount> EmployeeAccounts => Set<EmployeeAccount>();
    public DbSet<AdminAccount> AdminAccounts => Set<AdminAccount>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Employee>()
            .HasOne(e => e.CurrentDepartment)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.CurrentDepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Account)
            .WithOne(a => a.Employee)
            .HasForeignKey<EmployeeAccount>(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EmployeeAccount>()
            .HasIndex(a => a.Username)
            .IsUnique();

        modelBuilder.Entity<AdminAccount>()
            .HasIndex(a => a.Username)
            .IsUnique();

        modelBuilder.Entity<EducationRecord>()
            .HasOne(e => e.Employee)
            .WithMany(emp => emp.EducationRecords)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EmploymentHistory>()
            .HasOne(e => e.Employee)
            .WithMany(emp => emp.EmploymentHistories)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DepartmentHistory>()
            .HasOne(e => e.Employee)
            .WithMany(emp => emp.DepartmentHistories)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DepartmentHistory>()
            .HasOne(e => e.Department)
            .WithMany(d => d.DepartmentHistories)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(a => a.Employee)
            .WithMany(emp => emp.AttendanceRecords)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AttendanceRecord>()
            .HasIndex(a => new { a.EmployeeId, a.Date });

        modelBuilder.Entity<Employee>().Property(e => e.Gender).HasConversion<string>();
        modelBuilder.Entity<Employee>().Property(e => e.CivilStatus).HasConversion<string>();
        modelBuilder.Entity<EducationRecord>().Property(e => e.Level).HasConversion<string>();
    }
}
