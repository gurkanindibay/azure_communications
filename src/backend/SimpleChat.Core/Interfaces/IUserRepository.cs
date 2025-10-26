using SimpleChat.Core.Entities;

namespace SimpleChat.Core.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByEntraIdAsync(string entraIdObjectId);
    Task<IEnumerable<User>> GetOnlineUsersAsync();
    Task<IEnumerable<User>> SearchUsersAsync(string searchTerm);
    Task UpdateLastSeenAsync(Guid userId, DateTime lastSeenAt);
    Task UpdateOnlineStatusAsync(Guid userId, bool isOnline);
}
