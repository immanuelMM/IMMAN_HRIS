using HRIS.Api.Models;
using HRIS.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(HrisDbContext db, CredentialHasher hasher)
    {
        await db.Database.MigrateAsync();

        if (!await db.AdminAccounts.AnyAsync())
        {
            db.AdminAccounts.Add(new AdminAccount
            {
                Username = "admin",
                PasswordHash = hasher.Hash("Admin@123"),
            });
        }

        if (!await db.Departments.AnyAsync())
        {
            db.Departments.AddRange(
                new Department { Name = "Human Resources", Description = "People operations" },
                new Department { Name = "Engineering", Description = "Product development" },
                new Department { Name = "Finance", Description = "Accounting and finance" });
        }

        await db.SaveChangesAsync();
    }
}
