using Azure.Communication;
using Azure.Communication.Identity;
using Azure.Communication.Chat;
using Azure.Core;
using Azure.Identity;
using SimpleChat.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;

namespace SimpleChat.Infrastructure.Services;

public interface IAzureCommunicationService
{
    string Endpoint { get; }
    Task<CommunicationUserIdentifier> CreateUserIdentityAsync();
    Task<Azure.Core.AccessToken> GetTokenAsync(string acsUserId, IEnumerable<CommunicationTokenScope> scopes);
    Task<string> CreateChatThreadAsync(string topic, IEnumerable<string> participantIds);
    Task<string> SendMessageAsync(string threadId, string senderId, string content);
    Task AddParticipantAsync(string threadId, string userId);
    Task<CommunicationUserIdentifier> GetUserIdentityAsync(string userId);
}

public class AzureCommunicationService : IAzureCommunicationService
{
    private readonly CommunicationIdentityClient _identityClient;
    private readonly ChatClient _chatClient;
    private readonly ILogger<AzureCommunicationService> _logger;
    private readonly string _endpoint;

    public string Endpoint => _endpoint;

    public AzureCommunicationService(
        IConfiguration configuration,
        ILogger<AzureCommunicationService> logger)
    {
        var connectionString = configuration["AzureCommunicationServices:ConnectionString"];
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("Azure Communication Services connection string is not configured");
        }

        var connectionStringParts = connectionString.Split(';');
        var endpoint = connectionStringParts.First(p => p.StartsWith("endpoint=")).Split('=')[1];
        var accessKey = connectionStringParts.First(p => p.StartsWith("accesskey=")).Split('=')[1];

        _endpoint = endpoint;
        _identityClient = new CommunicationIdentityClient(connectionString);
        
        // Create a service user identity for ChatClient operations
        var serviceUser = _identityClient.CreateUserAsync().Result;
        var tokenResponse = _identityClient.GetTokenAsync(serviceUser.Value, new[] { CommunicationTokenScope.Chat }).Result;
        var tokenCredential = new CommunicationTokenCredential(tokenResponse.Value.Token);
        
        _chatClient = new ChatClient(new Uri(endpoint), tokenCredential);
        _logger = logger;
    }

    public async Task<CommunicationUserIdentifier> CreateUserIdentityAsync()
    {
        try
        {
            var response = await _identityClient.CreateUserAsync();
            _logger.LogInformation("Created ACS identity: {IdentityId}", response.Value.Id);
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create ACS identity");
            throw;
        }
    }

    public async Task<Azure.Core.AccessToken> GetTokenAsync(string acsUserId, IEnumerable<CommunicationTokenScope> scopes)
    {
        try
        {
            var user = new CommunicationUserIdentifier(acsUserId);
            var response = await _identityClient.GetTokenAsync(user, scopes);
            return response.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get ACS token for user {UserId}", acsUserId);
            throw;
        }
    }

    public async Task<string> CreateChatThreadAsync(string topic, IEnumerable<string> participantIds)
    {
        try
        {
            var participants = participantIds.Select(id =>
                new ChatParticipant(new CommunicationUserIdentifier(id))
                {
                    DisplayName = id
                });

            var response = await _chatClient.CreateChatThreadAsync(topic, participants);
            var threadId = response.Value.ChatThread.Id;

            _logger.LogInformation("Created ACS chat thread: {ThreadId}", threadId);
            return threadId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create ACS chat thread");
            throw;
        }
    }

    public async Task<string> SendMessageAsync(string threadId, string senderId, string content)
    {
        try
        {
            var chatThreadClient = _chatClient.GetChatThreadClient(threadId);
            var sendMessageOptions = new SendChatMessageOptions
            {
                Content = content,
                SenderDisplayName = senderId,
                MessageType = ChatMessageType.Text
            };

            var response = await chatThreadClient.SendMessageAsync(sendMessageOptions);
            return response.Value.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message to ACS thread {ThreadId}", threadId);
            throw;
        }
    }

    public async Task AddParticipantAsync(string threadId, string userId)
    {
        try
        {
            var chatThreadClient = _chatClient.GetChatThreadClient(threadId);
            var participant = new ChatParticipant(new CommunicationUserIdentifier(userId))
            {
                DisplayName = userId
            };

            await chatThreadClient.AddParticipantAsync(participant);
            _logger.LogInformation("Added participant {UserId} to ACS thread {ThreadId}", userId, threadId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add participant {UserId} to ACS thread {ThreadId}", userId, threadId);
            throw;
        }
    }

    public async Task<CommunicationUserIdentifier> GetUserIdentityAsync(string userId)
    {
        // For now, return a new identity. In production, you might want to cache or store these
        return new CommunicationUserIdentifier(userId);
    }
}