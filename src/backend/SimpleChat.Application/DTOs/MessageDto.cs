namespace SimpleChat.Application.DTOs;

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ChatThreadId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public bool IsRead { get; set; }
    public List<ReadReceiptDto> ReadReceipts { get; set; } = new();
}

public class SendMessageDto
{
    public Guid ChatThreadId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class ReadReceiptDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime ReadAt { get; set; }
}
