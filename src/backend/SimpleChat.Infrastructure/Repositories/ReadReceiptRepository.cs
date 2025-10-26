using Microsoft.EntityFrameworkCore;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;

namespace SimpleChat.Infrastructure.Repositories;

public class ReadReceiptRepository : Repository<ReadReceipt>, IReadReceiptRepository
{
    public ReadReceiptRepository(SimpleChatDbContext context) : base(context)
    {
    }

    public async Task<ReadReceipt?> GetReceiptAsync(Guid messageId, Guid userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(rr => rr.MessageId == messageId && rr.UserId == userId);
    }

    public async Task<IEnumerable<ReadReceipt>> GetMessageReceiptsAsync(Guid messageId)
    {
        return await _dbSet
            .Include(rr => rr.User)
            .Where(rr => rr.MessageId == messageId)
            .OrderBy(rr => rr.ReadAt)
            .ToListAsync();
    }

    public async Task MarkMessageAsReadAsync(Guid messageId, Guid userId)
    {
        var existingReceipt = await GetReceiptAsync(messageId, userId);
        
        if (existingReceipt == null)
        {
            var receipt = new ReadReceipt
            {
                Id = Guid.NewGuid(),
                MessageId = messageId,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            };
            
            await _dbSet.AddAsync(receipt);
        }
    }

    public async Task MarkMessagesAsReadAsync(IEnumerable<Guid> messageIds, Guid userId)
    {
        var existingReceipts = await _dbSet
            .Where(rr => messageIds.Contains(rr.MessageId) && rr.UserId == userId)
            .Select(rr => rr.MessageId)
            .ToListAsync();

        var newMessageIds = messageIds.Except(existingReceipts);
        var now = DateTime.UtcNow;

        var receipts = newMessageIds.Select(messageId => new ReadReceipt
        {
            Id = Guid.NewGuid(),
            MessageId = messageId,
            UserId = userId,
            ReadAt = now
        });

        await _dbSet.AddRangeAsync(receipts);
    }
}
