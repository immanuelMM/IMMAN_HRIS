using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace HRIS.Api.Services;

public class EmployeeQrService
{
    private const string Prefix = "HRISID";
    private readonly byte[] _key;

    public EmployeeQrService(IConfiguration config)
    {
        var jwtKey = config.GetSection("Jwt")["Key"]!;
        _key = Encoding.UTF8.GetBytes(jwtKey + ":employee-qr-v1");
    }

    public string GenerateToken(int employeeId)
    {
        var signature = Sign(employeeId);
        return $"{Prefix}:{employeeId}:{signature}";
    }

    public bool TryValidate(string token, out int employeeId)
    {
        employeeId = 0;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var parts = token.Trim().Split(':');
        if (parts.Length != 3 || parts[0] != Prefix)
        {
            return false;
        }

        if (!int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedId))
        {
            return false;
        }

        var expected = Sign(parsedId);
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(parts[2])))
        {
            return false;
        }

        employeeId = parsedId;
        return true;
    }

    private string Sign(int employeeId)
    {
        using var hmac = new HMACSHA256(_key);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(employeeId.ToString(CultureInfo.InvariantCulture)));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }
}
