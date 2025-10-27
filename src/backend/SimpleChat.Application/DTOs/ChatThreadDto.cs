namespace SimpleChat.Application.DTOs;

public class ChatThreadDto
{
    public Guid Id { get; set; }
    public string? AzureCommunicationThreadId { get; set; }
    public UserDto OtherUser { get; set; } = null!;
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
}

public class ChatThreadDetailDto
{
    public Guid Id { get; set; }
    public string? AzureCommunicationThreadId { get; set; }
    public UserDto User1 { get; set; } = null!;
    public UserDto User2 { get; set; } = null!;
    public List<MessageDto> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CreateChatThreadDto
{
    public Guid OtherUserId { get; set; }
}
