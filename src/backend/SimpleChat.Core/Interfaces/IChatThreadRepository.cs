using SimpleChat.Core.Entities;

namespace SimpleChat.Core.Interfaces;

public interface IChatThreadRepository : IRepository<ChatThread>
{
    Task<ChatThread?> GetThreadBetweenUsersAsync(Guid user1Id, Guid user2Id);
    Task<IEnumerable<ChatThread>> GetUserThreadsAsync(Guid userId);
    Task<ChatThread?> GetThreadWithMessagesAsync(Guid threadId, int pageSize = 50, int pageNumber = 1);
    Task UpdateLastMessageTimeAsync(Guid threadId, DateTime lastMessageAt);
}
