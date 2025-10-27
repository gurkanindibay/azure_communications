using SimpleChat.Application.DTOs;

namespace SimpleChat.Application.Interfaces;

public interface IAuthService
{
    Task<UserDto> InitializeUserAsync(string entraUserId);
    Task<AcsTokenResponse> GetAcsTokenAsync(string entraUserId);
}

public class AcsTokenResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresOn { get; set; }
    public string AcsUserId { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
}