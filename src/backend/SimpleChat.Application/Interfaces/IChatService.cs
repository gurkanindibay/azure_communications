using SimpleChat.Application.DTOs;

namespace SimpleChat.Application.Interfaces;

public interface IChatService
{
    Task<ChatThreadDto> GetOrCreateThreadAsync(Guid currentUserId, Guid otherUserId);
    Task<ChatThreadDetailDto?> GetThreadDetailsAsync(Guid threadId, Guid currentUserId, int pageSize = 50, int pageNumber = 1);
    Task<IEnumerable<ChatThreadDto>> GetUserThreadsAsync(Guid userId);
    Task<MessageDto> SendMessageAsync(Guid userId, SendMessageDto sendMessageDto);
    Task<IEnumerable<MessageDto>> GetThreadMessagesAsync(Guid threadId, int pageSize = 50, int pageNumber = 1);
    Task MarkMessagesAsReadAsync(Guid userId, Guid threadId);
    Task<int> GetUnreadCountAsync(Guid userId, Guid threadId);
}
