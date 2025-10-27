using SimpleChat.Application.DTOs;
using SimpleChat.Application.Interfaces;
using SimpleChat.Core.Entities;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Services;
using AutoMapper;

namespace SimpleChat.Application.Services;

public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAzureCommunicationService _acsService;
    private readonly IMapper _mapper;

    public ChatService(
        IUnitOfWork unitOfWork,
        IAzureCommunicationService acsService,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _acsService = acsService;
        _mapper = mapper;
    }

    public async Task<ChatThreadDto> GetOrCreateThreadAsync(Guid currentUserId, Guid otherUserId)
    {
        // Check if thread already exists
        var existingThread = await _unitOfWork.ChatThreads.GetThreadBetweenUsersAsync(currentUserId, otherUserId);

        if (existingThread != null)
        {
            var unreadCount = await _unitOfWork.Messages.GetUnreadCountAsync(currentUserId, existingThread.Id);
            return MapToThreadDto(existingThread, currentUserId, unreadCount);
        }

        // Get users
        var currentUser = await _unitOfWork.Users.GetByIdAsync(currentUserId);
        var otherUser = await _unitOfWork.Users.GetByIdAsync(otherUserId);

        if (currentUser == null || otherUser == null)
            throw new KeyNotFoundException("User not found");

        // Ensure both users have ACS identities
        if (string.IsNullOrEmpty(currentUser.AzureCommunicationUserId))
        {
            var acsIdentity = await _acsService.CreateUserIdentityAsync();
            currentUser.AzureCommunicationUserId = acsIdentity.Id;
            await _unitOfWork.Users.UpdateAsync(currentUser);
        }

        if (string.IsNullOrEmpty(otherUser.AzureCommunicationUserId))
        {
            var acsIdentity = await _acsService.CreateUserIdentityAsync();
            otherUser.AzureCommunicationUserId = acsIdentity.Id;
            await _unitOfWork.Users.UpdateAsync(otherUser);
        }

        // Create ACS chat thread
        var threadId = await _acsService.CreateChatThreadAsync(
            $"{currentUser.DisplayName} and {otherUser.DisplayName}",
            new[] { currentUser.AzureCommunicationUserId, otherUser.AzureCommunicationUserId });

        // Create conversation in database
        var newThread = new ChatThread
        {
            Id = Guid.NewGuid(),
            AzureCommunicationThreadId = threadId,
            User1Id = currentUserId,
            User2Id = otherUserId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _unitOfWork.ChatThreads.AddAsync(newThread);
        await _unitOfWork.SaveChangesAsync();

        // Reload with user information
        var thread = await _unitOfWork.ChatThreads.GetThreadBetweenUsersAsync(currentUserId, otherUserId);
        return MapToThreadDto(thread!, currentUserId, 0);
    }

    public async Task<ChatThreadDetailDto?> GetThreadDetailsAsync(Guid threadId, Guid currentUserId, int pageSize = 50, int pageNumber = 1)
    {
        var thread = await _unitOfWork.ChatThreads.GetThreadWithMessagesAsync(threadId, pageSize, pageNumber);

        if (thread == null)
        {
            return null;
        }

        // Verify user is part of the thread
        if (thread.User1Id != currentUserId && thread.User2Id != currentUserId)
        {
            throw new UnauthorizedAccessException("User is not a participant in this thread");
        }

        return new ChatThreadDetailDto
        {
            Id = thread.Id,
            AzureCommunicationThreadId = thread.AzureCommunicationThreadId,
            User1 = MapToUserDto(thread.User1),
            User2 = MapToUserDto(thread.User2),
            Messages = thread.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => MapToMessageDto(m, currentUserId))
                .ToList(),
            CreatedAt = thread.CreatedAt
        };
    }

    public async Task<IEnumerable<ChatThreadDto>> GetUserThreadsAsync(Guid userId)
    {
        var threads = await _unitOfWork.ChatThreads.GetUserThreadsAsync(userId);
        
        var threadDtos = new List<ChatThreadDto>();

        foreach (var thread in threads)
        {
            var unreadCount = await _unitOfWork.Messages.GetUnreadCountAsync(userId, thread.Id);
            threadDtos.Add(MapToThreadDto(thread, userId, unreadCount));
        }

        return threadDtos;
    }

    public async Task<MessageDto> SendMessageAsync(Guid userId, SendMessageDto sendMessageDto)
    {
        var thread = await _unitOfWork.ChatThreads.GetByIdAsync(sendMessageDto.ChatThreadId);

        if (thread == null)
        {
            throw new KeyNotFoundException($"Chat thread with ID {sendMessageDto.ChatThreadId} not found");
        }

        // Verify user is part of the thread
        if (thread.User1Id != userId && thread.User2Id != userId)
        {
            throw new UnauthorizedAccessException("User is not a participant in this thread");
        }

        var sender = await _unitOfWork.Users.GetByIdAsync(userId);
        if (sender == null || string.IsNullOrEmpty(sender.AzureCommunicationUserId))
        {
            throw new KeyNotFoundException("Sender not found or missing ACS identity");
        }

        // Send via ACS
        var acsMessageId = await _acsService.SendMessageAsync(
            thread.AzureCommunicationThreadId!,
            sender.AzureCommunicationUserId,
            sendMessageDto.Content);

        // Save to database
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatThreadId = sendMessageDto.ChatThreadId,
            SenderId = userId,
            AzureCommunicationMessageId = acsMessageId,
            Content = sendMessageDto.Content,
            SentAt = DateTime.UtcNow,
            Type = MessageType.Text,
            IsDeleted = false
        };

        await _unitOfWork.Messages.AddAsync(message);
        
        // Update thread's last message time
        await _unitOfWork.ChatThreads.UpdateLastMessageTimeAsync(thread.Id, message.SentAt);
        
        await _unitOfWork.SaveChangesAsync();

        // Reload message with sender info
        var savedMessage = await _unitOfWork.Messages.GetMessageWithReadReceiptsAsync(message.Id);
        return MapToMessageDto(savedMessage!, userId);
    }

    public async Task<IEnumerable<MessageDto>> GetThreadMessagesAsync(Guid threadId, int pageSize = 50, int pageNumber = 1)
    {
        var messages = await _unitOfWork.Messages.GetThreadMessagesAsync(threadId, pageSize, pageNumber);
        
        // We don't have current user context here, so IsRead will be false
        return messages.Select(m => MapToMessageDto(m, Guid.Empty));
    }

    public async Task MarkMessagesAsReadAsync(Guid userId, Guid threadId)
    {
        var unreadMessages = await _unitOfWork.Messages.GetUnreadMessagesAsync(userId, threadId);
        var messageIds = unreadMessages.Select(m => m.Id).ToList();

        if (messageIds.Any())
        {
            await _unitOfWork.ReadReceipts.MarkMessagesAsReadAsync(messageIds, userId);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, Guid threadId)
    {
        return await _unitOfWork.Messages.GetUnreadCountAsync(userId, threadId);
    }

    private static ChatThreadDto MapToThreadDto(ChatThread thread, Guid currentUserId, int unreadCount)
    {
        var otherUser = thread.User1Id == currentUserId ? thread.User2 : thread.User1;
        var lastMessage = thread.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();

        return new ChatThreadDto
        {
            Id = thread.Id,
            AzureCommunicationThreadId = thread.AzureCommunicationThreadId,
            OtherUser = MapToUserDto(otherUser),
            LastMessage = lastMessage != null ? MapToMessageDto(lastMessage, currentUserId) : null,
            UnreadCount = unreadCount,
            CreatedAt = thread.CreatedAt,
            LastMessageAt = thread.LastMessageAt
        };
    }

    private static MessageDto MapToMessageDto(Message message, Guid currentUserId)
    {
        var isRead = currentUserId != Guid.Empty && 
                     (message.SenderId == currentUserId || 
                      message.ReadReceipts.Any(rr => rr.UserId == currentUserId));

        return new MessageDto
        {
            Id = message.Id,
            ChatThreadId = message.ChatThreadId,
            SenderId = message.SenderId,
            SenderName = message.Sender?.DisplayName ?? "Unknown",
            Content = message.Content,
            SentAt = message.SentAt,
            EditedAt = message.EditedAt,
            IsRead = isRead,
            ReadReceipts = message.ReadReceipts.Select(rr => new ReadReceiptDto
            {
                UserId = rr.UserId,
                UserName = rr.User?.DisplayName ?? "Unknown",
                ReadAt = rr.ReadAt
            }).ToList()
        };
    }

    private static UserDto MapToUserDto(User user)
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
