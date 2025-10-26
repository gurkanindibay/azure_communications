namespace SimpleChat.Core.Entities;

/// <summary>
/// Represents a message in a chat thread
/// </summary>
public class Message
{
    public Guid Id { get; set; }
    
    public Guid ChatThreadId { get; set; }
    
    public Guid SenderId { get; set; }
    
    public string Content { get; set; } = string.Empty;
    
    public string? AzureCommunicationMessageId { get; set; }
    
    public DateTime SentAt { get; set; }
    
    public DateTime? EditedAt { get; set; }
    
    public bool IsDeleted { get; set; }
    
    public MessageType Type { get; set; } = MessageType.Text;
    
    // Navigation properties
    public virtual ChatThread ChatThread { get; set; } = null!;
    
    public virtual User Sender { get; set; } = null!;
    
    public virtual ICollection<ReadReceipt> ReadReceipts { get; set; } = new List<ReadReceipt>();
}

public enum MessageType
{
    Text = 0,
    System = 1
}
