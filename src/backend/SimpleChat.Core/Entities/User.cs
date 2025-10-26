namespace SimpleChat.Core.Entities;

/// <summary>
/// Represents a user in the Simple Chat application
/// </summary>
public class User
{
    public Guid Id { get; set; }
    
    public string EntraIdObjectId { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public string DisplayName { get; set; } = string.Empty;
    
    public string? AvatarUrl { get; set; }
    
    public string? AzureCommunicationUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? LastSeenAt { get; set; }
    
    public bool IsOnline { get; set; }
    
    // Navigation properties
    public virtual ICollection<ChatThread> ChatThreadsAsParticipant { get; set; } = new List<ChatThread>();
    
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    
    public virtual ICollection<ReadReceipt> ReadReceipts { get; set; } = new List<ReadReceipt>();
}
