using Microsoft.EntityFrameworkCore;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;

namespace SimpleChat.Infrastructure.Repositories;

public class ChatThreadRepository : Repository<ChatThread>, IChatThreadRepository
{
    public ChatThreadRepository(SimpleChatDbContext context) : base(context)
    {
    }

    public async Task<ChatThread?> GetThreadBetweenUsersAsync(Guid user1Id, Guid user2Id)
    {
        return await _dbSet
            .Include(ct => ct.User1)
            .Include(ct => ct.User2)
            .FirstOrDefaultAsync(ct => 
                (ct.User1Id == user1Id && ct.User2Id == user2Id) ||
                (ct.User1Id == user2Id && ct.User2Id == user1Id));
    }

    public async Task<IEnumerable<ChatThread>> GetUserThreadsAsync(Guid userId)
    {
        return await _dbSet
            .Include(ct => ct.User1)
            .Include(ct => ct.User2)
            .Include(ct => ct.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .Where(ct => (ct.User1Id == userId || ct.User2Id == userId) && ct.IsActive)
            .OrderByDescending(ct => ct.LastMessageAt ?? ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<ChatThread?> GetThreadWithMessagesAsync(Guid threadId, int pageSize = 50, int pageNumber = 1)
    {
        var skip = (pageNumber - 1) * pageSize;
        
        return await _dbSet
            .Include(ct => ct.User1)
            .Include(ct => ct.User2)
            .Include(ct => ct.Messages
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(pageSize))
                .ThenInclude(m => m.Sender)
            .Include(ct => ct.Messages)
                .ThenInclude(m => m.ReadReceipts)
            .FirstOrDefaultAsync(ct => ct.Id == threadId);
    }

    public async Task UpdateLastMessageTimeAsync(Guid threadId, DateTime lastMessageAt)
    {
        var thread = await _dbSet.FindAsync(threadId);
        if (thread != null)
        {
            thread.LastMessageAt = lastMessageAt;
        }
    }
}
