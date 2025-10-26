using Microsoft.EntityFrameworkCore;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;

namespace SimpleChat.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(SimpleChatDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByEntraIdAsync(string entraIdObjectId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.EntraIdObjectId == entraIdObjectId);
    }

    public async Task<IEnumerable<User>> GetOnlineUsersAsync()
    {
        return await _dbSet
            .Where(u => u.IsOnline)
            .OrderBy(u => u.DisplayName)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm)
    {
        var lowerSearchTerm = searchTerm.ToLower();
        
        return await _dbSet
            .Where(u => u.DisplayName.ToLower().Contains(lowerSearchTerm) 
                     || u.Email.ToLower().Contains(lowerSearchTerm))
            .OrderBy(u => u.DisplayName)
            .Take(20)
            .ToListAsync();
    }

    public async Task UpdateLastSeenAsync(Guid userId, DateTime lastSeenAt)
    {
        var user = await _dbSet.FindAsync(userId);
        if (user != null)
        {
            user.LastSeenAt = lastSeenAt;
        }
    }

    public async Task UpdateOnlineStatusAsync(Guid userId, bool isOnline)
    {
        var user = await _dbSet.FindAsync(userId);
        if (user != null)
        {
            user.IsOnline = isOnline;
            if (isOnline)
            {
                user.LastSeenAt = DateTime.UtcNow;
            }
        }
    }
}
