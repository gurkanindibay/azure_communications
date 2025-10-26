namespace SimpleChat.Core.Interfaces;

/// <summary>
/// Unit of Work pattern to manage transactions across multiple repositories
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IChatThreadRepository ChatThreads { get; }
    IMessageRepository Messages { get; }
    IReadReceiptRepository ReadReceipts { get; }
    
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
