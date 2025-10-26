using SimpleChat.Core.Entities;

namespace SimpleChat.Core.Interfaces;

public interface IMessageRepository : IRepository<Message>
{
    Task<IEnumerable<Message>> GetThreadMessagesAsync(Guid chatThreadId, int pageSize = 50, int pageNumber = 1);
    Task<IEnumerable<Message>> GetUnreadMessagesAsync(Guid userId, Guid chatThreadId);
    Task<Message?> GetMessageWithReadReceiptsAsync(Guid messageId);
    Task<int> GetUnreadCountAsync(Guid userId, Guid chatThreadId);
}
