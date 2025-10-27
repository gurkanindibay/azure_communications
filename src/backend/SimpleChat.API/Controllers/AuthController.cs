using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SimpleChat.Application.Interfaces;
using SimpleChat.Application.DTOs;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using Azure.Core;

namespace SimpleChat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        IUserService userService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get ACS token for the current user
    /// </summary>
    [HttpGet("acs-token")]
    [ProducesResponseType(typeof(AcsTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AcsTokenResponse>> GetAcsToken()
    {
        try
        {
            // Get current user from claims
            var entraId = User.FindFirst("sub")?.Value ?? User.FindFirst("oid")?.Value;
            if (string.IsNullOrEmpty(entraId))
            {
                return BadRequest(new { message = "User identity not found in token" });
            }

            var user = await _userService.GetUserByEntraIdAsync(entraId);
            if (user == null)
            {
                // Check if user exists by email (might have been created without EntraId)
                var email = User.FindFirst("email")?.Value ?? User.FindFirst("preferred_username")?.Value;
                if (!string.IsNullOrEmpty(email))
                {
                    user = await _userService.GetUserByEmailAsync(email);
                    if (user != null)
                    {
                        // User exists by email but not by EntraId - update the EntraId
                        await _userService.UpdateUserEntraIdAsync(user.Id, entraId);
                        _logger.LogInformation("Updated EntraId for existing user {UserId} with email {Email}", user.Id, email);
                    }
                }
                
                if (user == null)
                {
                    // Auto-create user from JWT claims
                    var name = User.FindFirst("name")?.Value ?? User.FindFirst("preferred_username")?.Value ?? "Unknown User";
                    var userEmail = email ?? $"{entraId}@unknown.com";
                    
                    var createUserDto = new SimpleChat.Application.DTOs.CreateUserDto
                    {
                        DisplayName = name,
                        Email = userEmail,
                        EntraIdObjectId = entraId
                    };
                    
                    try
                    {
                        user = await _userService.CreateUserAsync(createUserDto);
                        _logger.LogInformation("Auto-created user {UserId} for Entra ID {EntraId}", user.Id, entraId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to auto-create user for Entra ID {EntraId}", entraId);
                        return BadRequest(new { message = "Failed to create user account" });
                    }
                }
            }

            // Get ACS token using the auth service
            var acsToken = await _authService.GetAcsTokenAsync(entraId);

            return Ok(new AcsTokenResponse
            {
                Token = acsToken.Token,
                ExpiresOn = acsToken.ExpiresOn,
                AcsUserId = acsToken.AcsUserId,
                Endpoint = acsToken.Endpoint
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting ACS token for user");
            return StatusCode(500, new { message = "An error occurred while retrieving ACS token" });
        }
    }
}

public class AcsTokenResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresOn { get; set; }
    public string AcsUserId { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
}