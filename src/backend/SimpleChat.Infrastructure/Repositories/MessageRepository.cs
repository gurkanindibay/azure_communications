using Microsoft.EntityFrameworkCore;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;

namespace SimpleChat.Infrastructure.Repositories;

public class MessageRepository : Repository<Message>, IMessageRepository
{
    public MessageRepository(SimpleChatDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Message>> GetThreadMessagesAsync(Guid chatThreadId, int pageSize = 50, int pageNumber = 1)
    {
        var skip = (pageNumber - 1) * pageSize;
        
        return await _dbSet
            .Include(m => m.Sender)
            .Include(m => m.ReadReceipts)
            .Where(m => m.ChatThreadId == chatThreadId && !m.IsDeleted)
            .OrderBy(m => m.SentAt)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetUnreadMessagesAsync(Guid userId, Guid chatThreadId)
    {
        return await _dbSet
            .Include(m => m.Sender)
            .Where(m => m.ChatThreadId == chatThreadId 
                     && m.SenderId != userId
                     && !m.IsDeleted
                     && !m.ReadReceipts.Any(rr => rr.UserId == userId))
            .OrderBy(m => m.SentAt)
            .ToListAsync();
    }

    public async Task<Message?> GetMessageWithReadReceiptsAsync(Guid messageId)
    {
        return await _dbSet
            .Include(m => m.Sender)
            .Include(m => m.ReadReceipts)
                .ThenInclude(rr => rr.User)
            .FirstOrDefaultAsync(m => m.Id == messageId);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, Guid chatThreadId)
    {
        return await _dbSet
            .Where(m => m.ChatThreadId == chatThreadId 
                     && m.SenderId != userId
                     && !m.IsDeleted
                     && !m.ReadReceipts.Any(rr => rr.UserId == userId))
            .CountAsync();
    }
}
