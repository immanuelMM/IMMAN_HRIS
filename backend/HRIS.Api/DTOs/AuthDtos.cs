namespace HRIS.Api.DTOs;

public record AdminLoginRequest(string Username, string Password);
public record EmployeeLoginRequest(string Username, string Pin);

public record LoginResponse(string Token, string Role, string DisplayName);
