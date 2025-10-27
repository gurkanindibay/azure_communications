using SimpleChat.Application.DTOs;
using SimpleChat.Application.Interfaces;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Services;
using AutoMapper;
using Azure.Communication;
using Azure.Communication.Identity;

namespace SimpleChat.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAzureCommunicationService _acsService;
    private readonly IMapper _mapper;

    public AuthService(
        IUnitOfWork unitOfWork,
        IAzureCommunicationService acsService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _acsService = acsService;
        _mapper = mapper;
    }

    public async Task<UserDto> InitializeUserAsync(string entraUserId)
    {
        var existingUser = await _unitOfWork.Users.GetByEntraIdAsync(entraUserId);
        if (existingUser != null)
            return _mapper.Map<UserDto>(existingUser);

        // Create ACS identity for new user
        var acsIdentity = await _acsService.CreateUserIdentityAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            EntraIdObjectId = entraUserId,
            AzureCommunicationUserId = acsIdentity.Id,
            CreatedAt = DateTime.UtcNow,
            LastSeenAt = DateTime.UtcNow,
            IsOnline = false
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<AcsTokenResponse> GetAcsTokenAsync(string entraUserId)
    {
        var user = await _unitOfWork.Users.GetByEntraIdAsync(entraUserId);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        // Ensure user has ACS identity
        if (string.IsNullOrEmpty(user.AzureCommunicationUserId))
        {
            var acsIdentity = await _acsService.CreateUserIdentityAsync();
            user.AzureCommunicationUserId = acsIdentity.Id;
            await _unitOfWork.Users.UpdateAsync(user);
            await _unitOfWork.SaveChangesAsync();
        }

        var token = await _acsService.GetTokenAsync(
            user.AzureCommunicationUserId,
            new[] { CommunicationTokenScope.Chat, CommunicationTokenScope.VoIP });

        return new AcsTokenResponse
        {
            Token = token.Token,
            ExpiresOn = token.ExpiresOn,
            AcsUserId = user.AzureCommunicationUserId,
            Endpoint = _acsService.Endpoint
        };
    }
}