namespace SimpleChat.Core.Entities;

/// <summary>
/// Represents a read receipt for a message
/// </summary>
public class ReadReceipt
{
    public Guid Id { get; set; }
    
    public Guid MessageId { get; set; }
    
    public Guid UserId { get; set; }
    
    public DateTime ReadAt { get; set; }
    
    // Navigation properties
    public virtual Message Message { get; set; } = null!;
    
    public virtual User User { get; set; } = null!;
}
