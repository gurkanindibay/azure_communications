using SimpleChat.Core.Entities;

namespace SimpleChat.Core.Interfaces;

public interface IReadReceiptRepository : IRepository<ReadReceipt>
{
    Task<ReadReceipt?> GetReceiptAsync(Guid messageId, Guid userId);
    Task<IEnumerable<ReadReceipt>> GetMessageReceiptsAsync(Guid messageId);
    Task MarkMessageAsReadAsync(Guid messageId, Guid userId);
    Task MarkMessagesAsReadAsync(IEnumerable<Guid> messageIds, Guid userId);
}
