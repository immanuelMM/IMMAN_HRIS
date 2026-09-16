using System.Security.Cryptography;
using HRIS.Api.Data;
using HRIS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Services;

public class CredentialGenerator
{
    private readonly HrisDbContext _db;

    public CredentialGenerator(HrisDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateUsernameAsync(string firstName, string lastName)
    {
        var baseUsername = $"{Normalize(firstName)}.{Normalize(lastName)}";
        if (string.IsNullOrWhiteSpace(baseUsername) || baseUsername == ".")
        {
            baseUsername = "employee";
        }

        var candidate = baseUsername;
        var suffix = 1;
        while (await _db.EmployeeAccounts.AnyAsync(a => a.Username == candidate))
        {
            suffix++;
            candidate = $"{baseUsername}{suffix}";
        }

        return candidate;
    }

    public string GeneratePin()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }

    private static string Normalize(string value)
    {
        return new string(value.Trim().ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
    }
}
