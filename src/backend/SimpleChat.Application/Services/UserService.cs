using SimpleChat.Application.DTOs;
using SimpleChat.Application.Interfaces;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;

namespace SimpleChat.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto?> GetUserByEntraIdAsync(string entraIdObjectId)
    {
        var user = await _unitOfWork.Users.GetByEntraIdAsync(entraIdObjectId);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            EntraIdObjectId = createUserDto.EntraIdObjectId,
            Email = createUserDto.Email,
            DisplayName = createUserDto.DisplayName,
            AvatarUrl = createUserDto.AvatarUrl,
            CreatedAt = DateTime.UtcNow,
            IsOnline = false
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateUserDto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found");
        }

        if (!string.IsNullOrWhiteSpace(updateUserDto.DisplayName))
        {
            user.DisplayName = updateUserDto.DisplayName;
        }

        if (updateUserDto.AvatarUrl != null)
        {
            user.AvatarUrl = updateUserDto.AvatarUrl;
        }

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task UpdateUserEntraIdAsync(Guid userId, string entraIdObjectId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found");
        }

        user.EntraIdObjectId = entraIdObjectId;
        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm)
    {
        var users = await _unitOfWork.Users.SearchUsersAsync(searchTerm);
        return users.Select(MapToDto);
    }

    public async Task<IEnumerable<UserDto>> GetOnlineUsersAsync()
    {
        var users = await _unitOfWork.Users.GetOnlineUsersAsync();
        return users.Select(MapToDto);
    }

    public async Task UpdateUserOnlineStatusAsync(Guid userId, bool isOnline)
    {
        await _unitOfWork.Users.UpdateOnlineStatusAsync(userId, isOnline);
        await _unitOfWork.SaveChangesAsync();
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            IsOnline = user.IsOnline,
            LastSeenAt = user.LastSeenAt
        };
    }
}
