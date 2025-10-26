namespace SimpleChat.Core.Entities;

/// <summary>
/// Represents a chat thread (conversation) between two users
/// </summary>
public class ChatThread
{
    public Guid Id { get; set; }
    
    public string? AzureCommunicationThreadId { get; set; }
    
    public Guid User1Id { get; set; }
    
    public Guid User2Id { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? LastMessageAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual User User1 { get; set; } = null!;
    
    public virtual User User2 { get; set; } = null!;
    
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
