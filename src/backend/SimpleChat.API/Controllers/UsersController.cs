using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SimpleChat.Application.DTOs;
using SimpleChat.Application.Interfaces;
using SimpleChat.Application.Services;

namespace SimpleChat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            
            if (user == null)
            {
                return NotFound(new { message = $"User with ID {id} not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Get user by email
    /// </summary>
    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserByEmail(string email)
    {
        try
        {
            var user = await _userService.GetUserByEmailAsync(email);
            
            if (user == null)
            {
                return NotFound(new { message = $"User with email {email} not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by email {Email}", email);
            return StatusCode(500, new { message = "An error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Get user by Entra ID (Azure AD) object ID
    /// </summary>
    [HttpGet("entraid/{entraId}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserByEntraId(string entraId)
    {
        try
        {
            var user = await _userService.GetUserByEntraIdAsync(entraId);
            
            if (user == null)
            {
                return NotFound(new { message = $"User with Entra ID {entraId} not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by Entra ID {EntraId}", entraId);
            return StatusCode(500, new { message = "An error occurred while retrieving the user" });
        }
    }

    /// <summary>
    /// Get or create user by Entra ID (handles concurrent creation safely)
    /// </summary>
    [HttpPost("get-or-create")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<UserDto>> GetOrCreateUser([FromBody] CreateUserDto createUserDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetOrCreateUserAsync(createUserDto);
            
            // Return 200 if user existed, 201 if newly created
            // For simplicity, we'll always return 200 since the logic handles both cases
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting or creating user");
            return StatusCode(500, new { message = "An error occurred while getting or creating the user" });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto updateUserDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.UpdateUserAsync(id, updateUserDto);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User {UserId} not found for update", id);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the user" });
        }
    }

    /// <summary>
    /// Search users by display name or email
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> SearchUsers([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query cannot be empty" });
            }

            var users = await _userService.SearchUsersAsync(query);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with query {Query}", query);
            return StatusCode(500, new { message = "An error occurred while searching for users" });
        }
    }

    /// <summary>
    /// Get all online users
    /// </summary>
    [HttpGet("online")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetOnlineUsers()
    {
        try
        {
            var users = await _userService.GetOnlineUsersAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting online users");
            return StatusCode(500, new { message = "An error occurred while retrieving online users" });
        }
    }

    /// <summary>
    /// Update user online status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateOnlineStatusDto statusDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _userService.UpdateUserOnlineStatusAsync(id, statusDto.IsOnline);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User {UserId} not found for status update", id);
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status {UserId}", id);
            return StatusCode(500, new { message = "An error occurred while updating user status" });
        }
    }
}

public class UpdateOnlineStatusDto
{
    public bool IsOnline { get; set; }
}
