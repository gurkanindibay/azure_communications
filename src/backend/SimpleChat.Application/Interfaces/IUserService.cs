using SimpleChat.Application.DTOs;

namespace SimpleChat.Application.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetUserByIdAsync(Guid userId);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<UserDto?> GetUserByEntraIdAsync(string entraIdObjectId);
    Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateUserDto);
    Task UpdateUserEntraIdAsync(Guid userId, string entraIdObjectId);
    Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm);
    Task<IEnumerable<UserDto>> GetOnlineUsersAsync();
    Task UpdateUserOnlineStatusAsync(Guid userId, bool isOnline);
}
