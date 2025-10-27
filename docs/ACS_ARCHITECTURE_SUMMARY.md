# Azure Communication Services Architecture - Quick Reference

## ✅ Correct Message Flow

```
Frontend (React) ──────────────► Azure Communication Services ──────────────► Frontend (Other User)
                   Direct SDK                                    Real-time events
                   
                                         │
                                         │ (Optional)
                                         ▼
                                   Event Grid Webhook
                                         │
                                         ▼
                                   Backend API ──────► Database
                                              Store for history
```

## ❌ Incorrect Message Flow (Original Implementation)

```
Frontend ──────► Backend API ──────► ACS ──────► Frontend
           HTTP        Bottleneck!       Real-time
```

## Responsibility Breakdown

### Frontend Responsibilities
| Operation | Method | Service |
|-----------|--------|---------|
| Send message | `acsChatService.sendMessage()` | ACS Chat SDK |
| Receive messages | Event listener `chatMessageReceived` | ACS Chat SDK |
| Typing indicator | `acsChatService.sendTypingIndicator()` | ACS Chat SDK |
| Read receipts | `acsChatService.sendReadReceipt()` | ACS Chat SDK |
| Create thread | `apiService.getOrCreateThread()` | Backend API |
| Get ACS token | `apiService.getAcsToken()` | Backend API |
| Load history | `apiService.getThreadMessages()` | Backend API |

### Backend API Responsibilities
| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| Create thread | `POST /api/chats/thread` | Create ACS thread + save metadata |
| Get ACS token | `GET /api/auth/acs-token` | Generate ACS access token |
| List threads | `GET /api/chats/user/{userId}` | Query database |
| Get messages | `GET /api/chats/thread/{id}/messages` | Return history from DB |
| ~~Send message~~ | ~~`POST /api/chats/messages`~~ | ❌ **DEPRECATED** |

### Azure Communication Services Responsibilities
- Real-time message delivery (WebSocket/HTTPS)
- Message persistence (90 days default)
- Typing indicators
- Read receipts
- Thread participant management
- Offline message queueing

## Code Examples

### ✅ CORRECT: Frontend sends message directly to ACS

```typescript
// In ChatWindow.tsx or ChatContext.tsx
const handleSendMessage = async (content: string) => {
  if (!acsConnected) {
    throw new Error('Chat service not connected');
  }
  
  // Direct to ACS - no backend API call
  await acsChatService.sendMessage(content);
};
```

### ❌ WRONG: Frontend sends message via backend

```typescript
// ❌ DO NOT DO THIS
const handleSendMessage = async (content: string) => {
  await apiService.sendMessage(userId, {
    chatThreadId: threadId,
    content: content
  });
};
```

## Implementation Checklist

- [x] Frontend uses `acsChatService.sendMessage()` directly
- [x] Frontend listens to `chatMessageReceived` events
- [x] Backend's `SendMessage` endpoint marked as `[Obsolete]`
- [x] Frontend removed `apiService.sendMessage()` calls
- [ ] Backend implements Event Grid webhook handler (recommended)
- [ ] Remove deprecated `SendMessage` endpoint (future)
- [x] Updated DESIGN.md to clarify architecture
- [x] Created ARCHITECTURE_FIX.md documentation

## Key Benefits

### Performance
- **Latency**: ~50-100ms (direct) vs ~200-400ms (via backend)
- **Throughput**: Millions of messages/sec (ACS) vs limited by backend capacity
- **Scalability**: ACS auto-scales, backend becomes bottleneck

### Architecture
- **Separation of Concerns**: Real-time ≠ Backend API
- **Stateless Backend**: No WebSocket management
- **Independent Scaling**: Backend and chat scale separately

### Cost
- **Lower Backend Costs**: Fewer compute resources needed
- **Efficient ACS Usage**: Using service as designed

## Quick Test

To verify correct implementation:

```bash
# 1. Open browser dev tools on User A's chat
# 2. Filter network requests by "api/chats/messages"
# 3. Send a message
# 4. Should see NO requests to /api/chats/messages
# 5. Message should appear instantly on User B's screen
```

## References

- [Main Documentation](../ARCHITECTURE_FIX.md)
- [Design Document](../DESIGN.md) - Section 2.3 & 12.1
- [Azure ACS Best Practices](https://learn.microsoft.com/en-us/azure/communication-services/concepts/best-practices)
