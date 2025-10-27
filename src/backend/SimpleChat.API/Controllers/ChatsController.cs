using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SimpleChat.Application.DTOs;
using SimpleChat.Application.Interfaces;

namespace SimpleChat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class ChatsController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatsController> _logger;

    public ChatsController(
        IChatService chatService, 
        ILogger<ChatsController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Get all chat threads for a user
    /// </summary>
    [HttpGet("user/{userId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<ChatThreadDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ChatThreadDto>>> GetUserThreads(Guid userId)
    {
        try
        {
            var threads = await _chatService.GetUserThreadsAsync(userId);
            return Ok(threads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting threads for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving chat threads" });
        }
    }

    /// <summary>
    /// Get or create a chat thread between two users
    /// </summary>
    [HttpPost("thread")]
    [ProducesResponseType(typeof(ChatThreadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ChatThreadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChatThreadDto>> GetOrCreateThread([FromBody] CreateThreadRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.CurrentUserId == request.OtherUserId)
            {
                return BadRequest(new { message = "Cannot create a thread with yourself" });
            }

            var thread = await _chatService.GetOrCreateThreadAsync(request.CurrentUserId, request.OtherUserId);
            
            // Return 200 if existing, 201 if newly created
            // For simplicity, always returning 200 here
            return Ok(thread);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User not found when creating thread");
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating thread between users {User1} and {User2}", 
                request.CurrentUserId, request.OtherUserId);
            return StatusCode(500, new { message = "An error occurred while creating the chat thread" });
        }
    }

    /// <summary>
    /// Get thread details with messages
    /// </summary>
    [HttpGet("thread/{threadId:guid}")]
    [ProducesResponseType(typeof(ChatThreadDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ChatThreadDetailDto>> GetThreadDetails(
        Guid threadId, 
        [FromQuery] Guid currentUserId,
        [FromQuery] int pageSize = 50, 
        [FromQuery] int pageNumber = 1)
    {
        try
        {
            if (currentUserId == Guid.Empty)
            {
                return BadRequest(new { message = "Current user ID is required" });
            }

            if (pageSize < 1 || pageSize > 100)
            {
                return BadRequest(new { message = "Page size must be between 1 and 100" });
            }

            var thread = await _chatService.GetThreadDetailsAsync(threadId, currentUserId, pageSize, pageNumber);
            
            if (thread == null)
            {
                return NotFound(new { message = $"Thread with ID {threadId} not found" });
            }

            return Ok(thread);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} attempted to access thread {ThreadId}", currentUserId, threadId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting thread details for {ThreadId}", threadId);
            return StatusCode(500, new { message = "An error occurred while retrieving thread details" });
        }
    }

    /// <summary>
    /// Get messages for a thread
    /// </summary>
    [HttpGet("thread/{threadId:guid}/messages")]
    [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetThreadMessages(
        Guid threadId, 
        [FromQuery] int pageSize = 50, 
        [FromQuery] int pageNumber = 1)
    {
        try
        {
            if (pageSize < 1 || pageSize > 100)
            {
                return BadRequest(new { message = "Page size must be between 1 and 100" });
            }

            var messages = await _chatService.GetThreadMessagesAsync(threadId, pageSize, pageNumber);
            return Ok(messages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting messages for thread {ThreadId}", threadId);
            return StatusCode(500, new { message = "An error occurred while retrieving messages" });
        }
    }

    /// <summary>
    /// Send a message in a thread
    /// </summary>
    [HttpPost("messages")]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageDto>> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Message.Content))
            {
                return BadRequest(new { message = "Message content cannot be empty" });
            }

            var message = await _chatService.SendMessageAsync(request.UserId, request.Message);
            
            // ACS handles real-time messaging, no need for SignalR notifications
            
            return CreatedAtAction(
                nameof(GetThreadMessages), 
                new { threadId = message.ChatThreadId }, 
                message
            );
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Thread not found when sending message");
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} attempted to send message in thread {ThreadId}", 
                request.UserId, request.Message.ChatThreadId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message in thread {ThreadId}", request.Message.ChatThreadId);
            return StatusCode(500, new { message = "An error occurred while sending the message" });
        }
    }

    /// <summary>
    /// Mark all messages in a thread as read
    /// </summary>
    [HttpPost("thread/{threadId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkMessagesAsRead(Guid threadId, [FromBody] MarkAsReadRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.UserId == Guid.Empty)
            {
                return BadRequest(new { message = "User ID is required" });
            }

            await _chatService.MarkMessagesAsReadAsync(request.UserId, threadId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read for thread {ThreadId}", threadId);
            return StatusCode(500, new { message = "An error occurred while marking messages as read" });
        }
    }

    /// <summary>
    /// Get unread message count for a thread
    /// </summary>
    [HttpGet("thread/{threadId:guid}/unread")]
    [ProducesResponseType(typeof(UnreadCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount(Guid threadId, [FromQuery] Guid userId)
    {
        try
        {
            if (userId == Guid.Empty)
            {
                return BadRequest(new { message = "User ID is required" });
            }

            var count = await _chatService.GetUnreadCountAsync(userId, threadId);
            
            return Ok(new UnreadCountResponse 
            { 
                ThreadId = threadId, 
                UserId = userId, 
                UnreadCount = count 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for thread {ThreadId}", threadId);
            return StatusCode(500, new { message = "An error occurred while retrieving unread count" });
        }
    }
}

// Request/Response DTOs
public class CreateThreadRequest
{
    public Guid CurrentUserId { get; set; }
    public Guid OtherUserId { get; set; }
}

public class SendMessageRequest
{
    public Guid UserId { get; set; }
    public SendMessageDto Message { get; set; } = null!;
}

public class MarkAsReadRequest
{
    public Guid UserId { get; set; }
}

public class UnreadCountResponse
{
    public Guid ThreadId { get; set; }
    public Guid UserId { get; set; }
    public int UnreadCount { get; set; }
}
