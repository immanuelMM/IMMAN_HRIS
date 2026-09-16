using HRIS.Api.Data;
using HRIS.Api.DTOs;
using HRIS.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRIS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly HrisDbContext _db;
    private readonly CredentialHasher _hasher;
    private readonly JwtTokenService _jwt;

    public AuthController(HrisDbContext db, CredentialHasher hasher, JwtTokenService jwt)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
    }

    [HttpPost("admin/login")]
    public async Task<ActionResult<LoginResponse>> AdminLogin(AdminLoginRequest request)
    {
        var admin = await _db.AdminAccounts.FirstOrDefaultAsync(a => a.Username == request.Username);
        if (admin is null || !_hasher.Verify(admin.PasswordHash, request.Password))
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var token = _jwt.GenerateToken(admin.Id.ToString(), "Admin");
        return Ok(new LoginResponse(token, "Admin", admin.Username));
    }

    [HttpPost("employee/login")]
    public async Task<ActionResult<LoginResponse>> EmployeeLogin(EmployeeLoginRequest request)
    {
        var account = await _db.EmployeeAccounts
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Username == request.Username);

        if (account is null || !_hasher.Verify(account.PinHash, request.Pin))
        {
            return Unauthorized(new { message = "Invalid username or PIN." });
        }

        var claims = new[] { new System.Security.Claims.Claim("employeeId", account.EmployeeId.ToString()) };
        var token = _jwt.GenerateToken(account.EmployeeId.ToString(), "Employee", claims);
        return Ok(new LoginResponse(token, "Employee", account.Employee!.FullName));
    }
}
