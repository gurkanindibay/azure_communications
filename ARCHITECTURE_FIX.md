# Architecture Fix: ACS Communication Pattern

## Problem Identified

The original implementation had a critical design flaw where messages were being routed through the backend API before being sent to Azure Communication Services (ACS). This violated Azure best practices and the original design specifications.

### Incorrect Flow (Before Fix)
```
┌──────────┐     HTTP POST      ┌─────────────┐      ACS SDK       ┌─────────┐
│ Frontend │ ───────────────────→│   Backend   │ ──────────────────→│   ACS   │
│          │   /chats/messages   │   API       │   SendMessage()    │         │
└──────────┘                     └─────────────┘                    └─────────┘
                                        │                                 │
                                        ↓                                 │
                                  ┌──────────┐                           │
                                  │ Database │                           │
                                  └──────────┘                           │
                                                                          │
                                        Real-time events ←────────────────┘
                                                 ↓
                                           Frontend
```

**Problems:**
- ❌ Added unnecessary latency (frontend → backend → ACS instead of frontend → ACS)
- ❌ Backend becomes a bottleneck for all messages
- ❌ Defeats the purpose of ACS real-time infrastructure
- ❌ Backend doing work that ACS already handles
- ❌ Not horizontally scalable
- ❌ Violates separation of concerns

## Correct Architecture (After Fix)

### Message Sending Flow
```
┌──────────┐    ACS Chat SDK     ┌─────────┐
│ Frontend │ ───────────────────→│   ACS   │
│          │  (Direct WebSocket) │         │
└──────────┘                     └─────────┘
                                      │
                                      │ Real-time delivery
                                      ↓
                              All participants
                                      │
                                      │ Optional: Event Grid Webhooks
                                      ↓
                              ┌─────────────┐        ┌──────────┐
                              │   Backend   │────────→│ Database │
                              │     API     │        │          │
                              └─────────────┘        └──────────┘
                                (For persistence, search, analytics)
```

### Responsibility Matrix

| Operation | Frontend (React) | Backend API | ACS |
|-----------|------------------|-------------|-----|
| **Send Message** | ✅ Direct (ACS SDK) | ❌ Not involved | ✅ Delivers |
| **Receive Message** | ✅ Real-time events | ❌ Not involved | ✅ Pushes |
| **Typing Indicator** | ✅ Direct (ACS SDK) | ❌ Not involved | ✅ Broadcasts |
| **Read Receipts** | ✅ Direct (ACS SDK) | ❌ Not involved | ✅ Tracks |
| **Create Thread** | ❌ Calls API | ✅ Creates + persists | ✅ Hosts |
| **Get ACS Token** | ❌ Calls API | ✅ Generates | ✅ Issues |
| **List Threads** | ❌ Calls API | ✅ Queries DB | ❌ Not involved |
| **Message History** | ❌ Calls API | ✅ Queries DB | ✅ Can query (opt) |
| **User Management** | ❌ Calls API | ✅ CRUD operations | ❌ Not involved |
| **Message Persistence** | ❌ Not involved | ✅ Via webhooks | ✅ Sends events |

## Implementation Changes

### 1. Frontend Changes ✅

**File: `src/frontend/src/components/ChatWindow.tsx`**

**Before:**
```typescript
if (acsConnected) {
  await acsSendMessage(newMessage.trim());
} else {
  // Fallback to API - WRONG!
  await apiService.sendMessage(user.id, { ... });
}
```

**After:**
```typescript
if (!acsConnected) {
  throw new Error('Chat service not connected. Please refresh the page.');
}

// ALWAYS use ACS directly for real-time messaging
await acsSendMessage(newMessage.trim());
```

**File: `src/frontend/src/services/api.ts`**
- ✅ Removed `sendMessage()` method
- ✅ Added documentation explaining ACS direct communication
- ✅ Kept `getThreadMessages()` for loading history from DB

### 2. Backend Changes ✅

**File: `src/backend/SimpleChat.API/Controllers/ChatsController.cs`**
- ✅ Marked `SendMessage` endpoint as `[Obsolete]`
- ✅ Added documentation explaining proper architecture
- ✅ Endpoint kept for backward compatibility but discouraged

**File: `src/backend/SimpleChat.Application/Services/ChatService.cs`**
- ⚠️  `SendMessageAsync` method should be removed or repurposed
- 💡 Consider creating ACS Event Grid webhook handler instead

## How It Works Now

### Message Sending (Real-time)
1. User types message in frontend
2. Frontend validates input
3. Frontend calls `acsChatService.sendMessage(content)` directly
4. ACS receives message via WebSocket/HTTPS
5. ACS broadcasts message to all thread participants in real-time
6. All connected clients receive message via `chatMessageReceived` event
7. Frontend updates UI immediately

### Message Persistence (Async)
**Option A: Event Grid Webhooks (Recommended)**
```csharp
[ApiController]
[Route("api/webhooks")]
public class AcsWebhookController : ControllerBase
{
    [HttpPost("acs-events")]
    public async Task<IActionResult> HandleAcsEvents([FromBody] EventGridEvent[] events)
    {
        foreach (var evt in events)
        {
            if (evt.EventType == "Microsoft.Communication.ChatMessageReceived")
            {
                // Parse event data
                var messageData = evt.Data as ChatMessageReceivedEventData;
                
                // Save to database for history/search
                await SaveMessageToDatabase(messageData);
            }
        }
        return Ok();
    }
}
```

**Option B: Periodic Sync (Alternative)**
- Background job queries ACS for new messages
- Less efficient than webhooks
- Not real-time

### Thread Creation
1. Frontend calls `apiService.getOrCreateThread(currentUserId, otherUserId)`
2. Backend checks if thread exists in DB
3. If not, backend creates ACS thread via `AzureCommunicationService`
4. Backend saves thread metadata to DB
5. Backend returns thread info to frontend
6. Frontend uses ACS thread ID to join and send messages

### Message History Loading
1. Frontend joins thread
2. Frontend calls `acsChatService.getThreadMessages()` to load from ACS
3. Alternatively, frontend can call `apiService.getThreadMessages()` for DB history
4. ACS history is authoritative; DB is for search/analytics

## Benefits of This Architecture

### Performance
- ✅ **Lower Latency**: Direct frontend → ACS communication (no backend hop)
- ✅ **Better Throughput**: Backend doesn't process every message
- ✅ **Scalability**: ACS handles millions of concurrent connections

### Architecture
- ✅ **Separation of Concerns**: Real-time messaging is ACS's job, not backend's
- ✅ **Stateless Backend**: No WebSocket management, just REST APIs
- ✅ **Horizontal Scaling**: Backend can scale independently of chat load

### Cost
- ✅ **Lower Backend Costs**: Fewer API calls, less compute
- ✅ **Efficient ACS Usage**: Using ACS as designed (direct client access)

### Reliability
- ✅ **Built-in Retry**: ACS SDK handles reconnection
- ✅ **Message Delivery**: ACS guarantees delivery to online participants
- ✅ **Offline Support**: ACS queues messages for offline users

## Migration Notes

### For Existing Deployments
1. **Frontend Changes**: Deploy updated frontend first
   - Old frontend will fail gracefully if ACS not connected
   - New frontend will never call deprecated `/chats/messages` endpoint

2. **Backend Changes**: Deploy backend updates
   - Deprecated endpoint still works for old clients
   - Remove endpoint in next major version

3. **Enable Event Grid**: Configure ACS Event Grid webhooks
   - Create Event Grid subscription for ACS events
   - Point to new webhook endpoint
   - Messages will start persisting automatically

### Testing Checklist
- [ ] Frontend sends messages directly to ACS
- [ ] Messages appear in real-time for both users
- [ ] No calls to `/chats/messages` endpoint
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Message history loads correctly
- [ ] Thread creation still works
- [ ] Event Grid webhooks persist messages to DB

## References

### Azure Documentation
- [Azure Communication Services Chat SDK](https://learn.microsoft.com/en-us/azure/communication-services/concepts/chat/sdk-features)
- [ACS Event Grid Integration](https://learn.microsoft.com/en-us/azure/communication-services/concepts/event-handling)
- [Best Practices for Chat](https://learn.microsoft.com/en-us/azure/communication-services/concepts/best-practices)

### Design Documents
- See `DESIGN.md` Section 7.3: "Frontend ↔ ACS" (Direct communication pattern)
- See `DESIGN.md` Section 7.4: "Backend ↔ ACS" (Token generation and thread creation only)

## Next Steps

### Recommended Improvements
1. **Add Event Grid Webhook Handler** (High Priority)
   - Create `AcsWebhookController`
   - Subscribe to ACS events
   - Persist messages asynchronously

2. **Remove Deprecated Endpoint** (Future)
   - After confirming no clients use it
   - Remove `SendMessage` from `ChatsController`
   - Remove `SendMessageAsync` from `ChatService`

3. **Add Message Deduplication** (Nice to Have)
   - Use ACS message ID as primary key
   - Prevent duplicate saves from webhooks

4. **Add Delivery Status Tracking** (Nice to Have)
   - Track which messages are delivered/read via ACS events
   - Update DB accordingly

## Conclusion

This fix aligns the implementation with Azure Communication Services best practices and the original design specifications. Messages now flow directly from frontend to ACS, with the backend handling only orchestration, persistence, and business logic—not real-time message relay.

**Key Principle**: *Use Azure Communication Services for what it's designed for (real-time communication), and use your backend for what it's designed for (business logic and data persistence).*
