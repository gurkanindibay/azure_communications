using Microsoft.AspNetCore.SignalR;

namespace SimpleChat.API.Hubs;

public class ChatHub : Hub
{
    public async Task SendMessage(string threadId, string message)
    {
        // Broadcast to all clients in the thread group
        await Clients.Group(threadId).SendAsync("ReceiveMessage", threadId, message);
    }

    public async Task JoinThread(string threadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, threadId);
    }

    public async Task LeaveThread(string threadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, threadId);
    }

    public async Task NotifyTyping(string threadId, string userId)
    {
        await Clients.OthersInGroup(threadId).SendAsync("UserTyping", userId);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        Console.WriteLine($"Client connected: {Context.ConnectionId}");
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
        Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
    }
}
