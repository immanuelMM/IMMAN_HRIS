using Microsoft.AspNetCore.Identity;

namespace HRIS.Api.Services;

public class CredentialHasher
{
    private readonly PasswordHasher<object> _hasher = new();

    public string Hash(string plainText) => _hasher.HashPassword(new object(), plainText);

    public bool Verify(string hash, string plainText)
    {
        var result = _hasher.VerifyHashedPassword(new object(), hash, plainText);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
