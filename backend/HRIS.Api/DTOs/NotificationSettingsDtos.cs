namespace HRIS.Api.DTOs;

public record TestEmailRequest(string Email);

public record TestSmsRequest(string Phone);

public record TestSendResponse(bool Success, string Message);
