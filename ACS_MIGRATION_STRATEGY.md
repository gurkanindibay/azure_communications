# Azure Communication Services Migration Strategy

## Transition from SignalR to ACS (Azure Communication Services)

**Date:** October 27, 2025  
**Version:** 1.0  
**Authors:** GitHub Copilot  
**Status:** Draft  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Migration Strategy](#4-migration-strategy)
5. [Detailed Implementation Plan](#5-detailed-implementation-plan)
6. [Risk Assessment](#6-risk-assessment)
7. [Testing Strategy](#7-testing-strategy)
8. [Rollback Plan](#8-rollback-plan)
9. [Success Criteria](#9-success-criteria)
10. [Timeline](#10-timeline)
11. [Appendices](#11-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the strategy for migrating the Simple Chat Application from its current SignalR-based real-time messaging implementation to Azure Communication Services (ACS). The migration adopts a **hybrid architecture** where the backend manages ACS resources and business logic, while clients communicate directly with ACS for optimal real-time performance.

### 1.2 Business Value
- **Improved Scalability**: ACS can handle millions of concurrent connections
- **Reduced Latency**: Direct client-to-ACS communication for real-time messaging
- **Cost Efficiency**: Pay-per-use model with no server maintenance for WebSocket connections
- **Future-Proof**: Access to ACS features like voice/video calling, SMS, and email

### 1.3 Migration Approach
**Hybrid Architecture**: Backend controls ACS identities and threads, clients communicate directly with ACS for real-time messaging.

### 1.4 Success Metrics
- Zero message loss during migration
- <500ms message delivery latency
- 99.9% uptime during transition
- All existing features preserved

---

## 2. Current State Analysis

### 2.1 Current Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │────│  Backend    │────│  Database   │
│  (React)    │    │  (ASP.NET)  │    │  (SQL)      │
│             │    │             │    │             │
│ - REST API  │    │ - REST API  │    │ - Users     │
│ - SignalR   │    │ - SignalR   │    │ - Messages  │
│   Client    │    │   Hub       │    │ - Threads   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 Current Implementation Details

**Backend (ASP.NET Core):**
- `ChatHub.cs`: SignalR hub for real-time messaging
- `ChatService.cs`: Business logic for chat operations
- `Program.cs`: SignalR configuration and middleware

**Frontend (React/TypeScript):**
- `@microsoft/signalr`: Client library for real-time communication
- REST API calls for chat operations
- Context-based state management

**Database:**
- SQL Server with chat-related tables
- ACS fields already prepared (`AzureCommunicationUserId`, etc.)

### 2.3 Current Limitations
- SignalR requires server-side WebSocket management
- Scalability limited by backend server capacity
- Additional network hop for real-time messages
- Manual connection management and reconnection logic

---

## 3. Target Architecture

### 3.1 Hybrid ACS Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────┐
│   Client    │────│  Backend    │────│ ACS  │
│  (React)    │    │  (ASP.NET)  │    │      │
│             │    │             │    │      │
│ - REST API  │    │ - REST API  │    │ - Real│
│ - ACS Chat  │    │ - ACS Mgmt  │    │   time│
│   SDK       │    │ - Business  │    │   chat│
│             │    │   Logic     │    │      │
└─────────────┘    └─────────────┘    └──────┘
                    │
                    ▼
             ┌─────────────┐
             │  Database   │
             │  (SQL)      │
             │             │
             │ - Users     │
             │ - Messages  │
             │ - Threads   │
             └─────────────┘
```

### 3.2 Component Responsibilities

**Backend (ASP.NET Core API):**
- **ACS Identity Management**: Create and manage ACS user identities
- **Token Generation**: Issue short-lived ACS access tokens
- **Thread Management**: Create and manage chat threads
- **Business Logic**: User management, message persistence, analytics
- **Security**: Authentication, authorization, rate limiting

**Frontend (React/TypeScript):**
- **ACS Integration**: Direct communication with ACS for real-time messaging
- **Token Management**: Request and refresh ACS tokens from backend
- **UI Components**: Chat interface, real-time event handling
- **State Management**: Local state for messages, presence, typing indicators

**Azure Communication Services:**
- **Real-time Messaging**: WebSocket-based message delivery
- **Identity Service**: User identity and access token management
- **Chat Service**: Thread management, message history, real-time events
- **Scalability**: Global infrastructure for high-concurrency scenarios

### 3.3 Data Flow

```
1. Authentication: Client → Entra ID → Backend → Database
2. ACS Setup: Backend → ACS (create identity) → Database (store ACS ID)
3. Token Request: Client → Backend → ACS (generate token) → Client
4. Chat Init: Client → ACS (initialize chat client)
5. Thread Create: Client → Backend → ACS (create thread) → Database
6. Messaging: Client ↔ ACS (real-time, direct communication)
7. Persistence: ACS events → Backend → Database (async)
```

---

## 4. Migration Strategy

### 4.1 Migration Principles

1. **Incremental Migration**: Phase-by-phase implementation with testing
2. **Backward Compatibility**: Maintain SignalR as fallback during transition
3. **Zero Downtime**: Ensure continuous service availability
4. **Feature Parity**: Preserve all existing functionality
5. **Performance First**: Optimize for low latency and high concurrency

### 4.2 Migration Phases

#### Phase 1: Foundation (Week 1)
- Update dependencies and project structure
- Implement ACS backend services
- Create ACS identity and token management
- Update database schema utilization

#### Phase 2: Core Integration (Week 2)
- Implement ACS chat service in frontend
- Update chat business logic
- Modify API controllers for ACS compatibility
- Remove SignalR components

#### Phase 3: Testing & Optimization (Week 3)
- Comprehensive testing and bug fixes
- Performance optimization
- Update deployment scripts
- Production deployment preparation

### 4.3 Technical Strategy

#### 4.3.1 Dependency Management
- Add ACS SDKs to backend: `Azure.Communication.Identity`, `Azure.Communication.Chat`
- Ensure frontend ACS SDKs are current: `@azure/communication-chat`, `@azure/communication-common`
- Remove SignalR dependencies after migration

#### 4.3.2 Configuration Strategy
- Environment-based ACS connection strings
- Secure token storage and rotation
- CORS configuration for ACS endpoints
- Monitoring and logging setup

#### 4.3.3 Data Migration Strategy
- Existing chat data remains accessible
- ACS IDs populated for new users/threads
- Gradual migration of active threads
- Message history preservation

---

## 5. Detailed Implementation Plan

### 5.1 Phase 1: Backend ACS Foundation

#### 5.1.1 Update Dependencies
```bash
# Backend
dotnet add package Azure.Communication.Identity --version 1.3.0
dotnet add package Azure.Communication.Chat --version 1.3.0
dotnet add package Azure.Communication.Common --version 2.3.0

# Frontend
npm install @azure/communication-chat@latest
npm install @azure/communication-common@latest
```

#### 5.1.2 Create ACS Infrastructure Service
**New File:** `Infrastructure/Services/AzureCommunicationService.cs`

```csharp
public interface IAzureCommunicationService
{
    Task<CommunicationUserIdentifier> CreateUserIdentityAsync();
    Task<AccessToken> GetTokenAsync(string acsUserId, IEnumerable<CommunicationTokenScope> scopes);
    Task<string> CreateChatThreadAsync(string topic, IEnumerable<string> participantIds);
    Task SendMessageAsync(string threadId, string senderId, string content);
    Task AddParticipantAsync(string threadId, string userId);
    Task<CommunicationUserIdentifier> GetUserIdentityAsync(string userId);
}

public class AzureCommunicationService : IAzureCommunicationService
{
    private readonly CommunicationIdentityClient _identityClient;
    private readonly ChatClient _chatClient;
    private readonly ILogger<AzureCommunicationService> _logger;

    public AzureCommunicationService(IConfiguration configuration, ILogger<AzureCommunicationService> logger)
    {
        var connectionString = configuration["AzureCommunicationServices:ConnectionString"];
        _identityClient = new CommunicationIdentityClient(connectionString);
        _chatClient = new ChatClient(connectionString);
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

    public async Task<AccessToken> GetTokenAsync(string acsUserId, IEnumerable<CommunicationTokenScope> scopes)
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

    public async Task SendMessageAsync(string threadId, string senderId, string content)
    {
        try
        {
            var chatThreadClient = _chatClient.GetChatThreadClient(threadId);
            await chatThreadClient.SendMessageAsync(
                new SendChatMessageOptions
                {
                    Content = content,
                    SenderDisplayName = senderId,
                    MessageType = ChatMessageType.Text
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message to ACS thread {ThreadId}", threadId);
            throw;
        }
    }
}
```

#### 5.1.3 Update AuthService for ACS Integration
**Modify:** `Application/Services/AuthService.cs`

```csharp
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IAzureCommunicationService _acsService;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepository,
        IAzureCommunicationService acsService,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _acsService = acsService;
        _mapper = mapper;
    }

    public async Task<UserDto> InitializeUserAsync(string entraUserId)
    {
        var existingUser = await _userRepository.GetByEntraIdAsync(entraUserId);
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
            LastSeen = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<AcsTokenResponse> GetAcsTokenAsync(string entraUserId)
    {
        var user = await _userRepository.GetByEntraIdAsync(entraUserId);
        if (user == null)
            throw new NotFoundException("User not found");

        // Ensure user has ACS identity
        if (string.IsNullOrEmpty(user.AzureCommunicationUserId))
        {
            var acsIdentity = await _acsService.CreateUserIdentityAsync();
            user.AzureCommunicationUserId = acsIdentity.Id;
            await _userRepository.UpdateAsync(user);
            await _userRepository.SaveChangesAsync();
        }

        var token = await _acsService.GetTokenAsync(
            user.AzureCommunicationUserId,
            new[] { CommunicationTokenScope.Chat, CommunicationTokenScope.VoIP });

        return new AcsTokenResponse
        {
            Token = token.Token,
            ExpiresOn = token.ExpiresOn,
            AcsUserId = user.AzureCommunicationUserId
        };
    }
}
```

#### 5.1.4 Update ChatService for ACS
**Modify:** `Application/Services/ChatService.cs`

```csharp
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

    public async Task<ChatThreadDto> CreateConversationAsync(string creatorEntraId, Guid participantUserId)
    {
        var creator = await _unitOfWork.Users.GetByEntraIdAsync(creatorEntraId);
        var participant = await _unitOfWork.Users.GetByIdAsync(participantUserId);

        if (participant == null)
            throw new NotFoundException("Participant not found");

        // Check if conversation already exists
        var existing = await _unitOfWork.ChatThreads.GetThreadBetweenUsersAsync(creator.Id, participantUserId);
        if (existing != null)
            return _mapper.Map<ChatThreadDto>(existing);

        // Create ACS chat thread
        var threadId = await _acsService.CreateChatThreadAsync(
            $"{creator.DisplayName} and {participant.DisplayName}",
            new[] { creator.AzureCommunicationUserId, participant.AzureCommunicationUserId });

        // Create conversation in database
        var conversation = new ChatThread
        {
            Id = Guid.NewGuid(),
            AzureCommunicationThreadId = threadId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = creator.Id
        };

        conversation.Participants = new List<Participant>
        {
            new() { UserId = creator.Id, JoinedAt = DateTime.UtcNow },
            new() { UserId = participantUserId, JoinedAt = DateTime.UtcNow }
        };

        await _unitOfWork.ChatThreads.AddAsync(conversation);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<ChatThreadDto>(conversation);
    }

    public async Task<MessageDto> SendMessageAsync(Guid conversationId, string senderEntraId, string content)
    {
        var conversation = await _unitOfWork.ChatThreads.GetByIdAsync(conversationId);
        if (conversation == null)
            throw new NotFoundException("Conversation not found");

        var sender = await _unitOfWork.Users.GetByEntraIdAsync(senderEntraId);

        // Send via ACS
        var acsMessageId = await _acsService.SendMessageAsync(
            conversation.AzureCommunicationThreadId,
            sender.AzureCommunicationUserId,
            content);

        // Save to database
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ChatThreadId = conversationId,
            SenderId = sender.Id,
            AzureCommunicationMessageId = acsMessageId,
            Content = content,
            SentAt = DateTime.UtcNow,
            Type = MessageType.Text
        };

        await _unitOfWork.Messages.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<MessageDto>(message);
    }
}
```

### 5.2 Phase 2: Frontend ACS Integration

#### 5.2.1 Create ACS Chat Service
**New File:** `services/acsChatService.ts`

```typescript
import { ChatClient, ChatMessageReceivedEvent } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

export interface AcsChatEventHandlers {
  onMessageReceived?: (message: ChatMessageReceivedEvent) => void;
  onTypingIndicatorReceived?: (event: any) => void;
  onReadReceiptReceived?: (event: any) => void;
  onChatMessageEdited?: (event: any) => void;
  onChatMessageDeleted?: (event: any) => void;
  onParticipantsAdded?: (event: any) => void;
  onParticipantsRemoved?: (event: any) => void;
}

export class AcsChatService {
  private chatClient: ChatClient | null = null;
  private currentThreadId: string | null = null;
  private eventHandlers: AcsChatEventHandlers = {};

  async initialize(
    userId: string,
    token: string,
    endpoint: string,
    eventHandlers?: AcsChatEventHandlers
  ): Promise<void> {
    try {
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      this.chatClient = new ChatClient(endpoint, tokenCredential);

      if (eventHandlers) {
        this.eventHandlers = eventHandlers;
        this.setupEventHandlers();
      }

      // Start real-time notifications
      await this.chatClient.startRealtimeNotifications();
    } catch (error) {
      console.error('Failed to initialize ACS chat client:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.chatClient) return;

    this.chatClient.on('chatMessageReceived', (event) => {
      this.eventHandlers.onMessageReceived?.(event);
    });

    this.chatClient.on('typingIndicatorReceived', (event) => {
      this.eventHandlers.onTypingIndicatorReceived?.(event);
    });

    this.chatClient.on('readReceiptReceived', (event) => {
      this.eventHandlers.onReadReceiptReceived?.(event);
    });

    this.chatClient.on('chatMessageEdited', (event) => {
      this.eventHandlers.onChatMessageEdited?.(event);
    });

    this.chatClient.on('chatMessageDeleted', (event) => {
      this.eventHandlers.onChatMessageDeleted?.(event);
    });

    this.chatClient.on('participantsAdded', (event) => {
      this.eventHandlers.onParticipantsAdded?.(event);
    });

    this.chatClient.on('participantsRemoved', (event) => {
      this.eventHandlers.onParticipantsRemoved?.(event);
    });
  }

  async joinThread(threadId: string): Promise<void> {
    if (!this.chatClient) throw new Error('Chat client not initialized');

    this.currentThreadId = threadId;
    // ACS handles thread membership automatically when sending messages
  }

  async sendMessage(content: string): Promise<string> {
    if (!this.chatClient || !this.currentThreadId) {
      throw new Error('Chat client not initialized or no active thread');
    }

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    const result = await chatThreadClient.sendMessage({ content });

    return result.id;
  }

  async sendTypingIndicator(): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.sendTypingNotification();
  }

  async sendReadReceipt(messageId: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.sendReadReceipt({ chatMessageId: messageId });
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.updateMessage(messageId, { content });
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.chatClient || !this.currentThreadId) return;

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    await chatThreadClient.deleteMessage(messageId);
  }

  async getThreadMessages(options?: {
    maxPageSize?: number;
    startTime?: Date;
  }): Promise<any[]> {
    if (!this.chatClient || !this.currentThreadId) return [];

    const chatThreadClient = this.chatClient.getChatThreadClient(this.currentThreadId);
    const messages = chatThreadClient.listMessages(options);

    const result: any[] = [];
    for await (const message of messages) {
      result.push(message);
    }

    return result;
  }

  dispose(): void {
    if (this.chatClient) {
      this.chatClient.stopRealtimeNotifications();
      this.chatClient = null;
    }
    this.currentThreadId = null;
    this.eventHandlers = {};
  }
}

export const acsChatService = new AcsChatService();
```

#### 5.2.2 Update Chat Context
**Modify:** `contexts/ChatContext.tsx`

```typescript
// Update to use ACS instead of SignalR
const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // ACS event handlers
  const acsEventHandlers = useMemo(() => ({
    onMessageReceived: (event: ChatMessageReceivedEvent) => {
      const newMessage: Message = {
        id: event.id,
        content: event.message,
        senderId: event.sender.id,
        senderName: event.senderDisplayName || 'Unknown',
        sentAt: new Date(event.createdOn),
        type: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onTypingIndicatorReceived: (event: any) => {
      // Handle typing indicators
      console.log('Typing:', event.senderDisplayName);
    },
    onReadReceiptReceived: (event: any) => {
      // Handle read receipts
      console.log('Read receipt:', event);
    }
  }), []);

  useEffect(() => {
    const initializeChat = async () => {
      if (user && acsToken && acsEndpoint) {
        try {
          await acsChatService.initialize(
            user.acsUserId,
            acsToken,
            acsEndpoint,
            acsEventHandlers
          );
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to initialize ACS chat:', error);
          setIsConnected(false);
        }
      }
    };

    initializeChat();

    return () => {
      acsChatService.dispose();
      setIsConnected(false);
    };
  }, [user, acsToken, acsEndpoint, acsEventHandlers]);

  const joinThread = async (threadId: string) => {
    try {
      await acsChatService.joinThread(threadId);
      setCurrentThreadId(threadId);

      // Load existing messages
      const threadMessages = await acsChatService.getThreadMessages();
      const formattedMessages = threadMessages.map(msg => ({
        id: msg.id,
        content: msg.content?.message || '',
        senderId: msg.sender?.id || '',
        senderName: msg.senderDisplayName || 'Unknown',
        sentAt: new Date(msg.createdOn),
        type: 'text'
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to join thread:', error);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const messageId = await acsChatService.sendMessage(content);
      // Message will be received via real-time events
      // Optionally persist via API for additional metadata
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const sendTypingIndicator = async () => {
    try {
      await acsChatService.sendTypingIndicator();
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await acsChatService.sendReadReceipt(messageId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      isConnected,
      currentThreadId,
      joinThread,
      sendMessage,
      sendTypingIndicator,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};
```

### 5.3 Phase 3: Configuration & Deployment

#### 5.3.1 Update Configuration Files

**appsettings.Production.json:**
```json
{
  "AzureCommunicationServices": {
    "ConnectionString": "endpoint=https://your-acs-resource.communication.azure.com/;accesskey=your-access-key",
    "Endpoint": "https://your-acs-resource.communication.azure.com/"
  }
}
```

**Frontend .env.production:**
```env
VITE_ACS_ENDPOINT=https://your-acs-resource.communication.azure.com/
VITE_API_BASE_URL=https://your-api.azurewebsites.net/api
```

#### 5.3.2 Update Deployment Scripts

**Modify `deploy-to-azure.sh`:**
```bash
# Add ACS resource creation
echo "Creating Azure Communication Services..."
az communication create \
  --name "$ACR_NAME-acs" \
  --resource-group "$RESOURCE_GROUP" \
  --location "Global" \
  --data-location "UnitedStates"

# Get ACS connection string
ACS_CONNECTION_STRING=$(az communication list-key \
  --name "$ACR_NAME-acs" \
  --resource-group "$RESOURCE_GROUP" \
  --query primaryConnectionString \
  --output tsv)

# Update backend app settings
az webapp config appsettings set \
  --name "$BACKEND_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings AzureCommunicationServices__ConnectionString="$ACS_CONNECTION_STRING"

# Update frontend environment variables
az staticwebapp environment-variables set \
  --name "$FRONTEND_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment-variables VITE_ACS_ENDPOINT="https://$ACR_NAME-acs.communication.azure.com/"
```

---

## 6. Risk Assessment

### 6.1 High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ACS service outage | High | Low | Implement retry logic, fallback to SignalR during transition |
| Token expiration issues | Medium | Medium | Implement token refresh logic, monitor expiration |
| Message delivery failures | High | Low | ACS guarantees delivery, implement client-side retry |
| Database migration issues | High | Low | Test migrations thoroughly, backup before deployment |

### 6.2 Medium Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Frontend ACS SDK compatibility | Medium | Low | Test across browsers, implement graceful degradation |
| Performance degradation | Medium | Medium | Monitor latency, optimize bundle size |
| CORS configuration issues | Medium | Low | Test thoroughly in staging environment |

### 6.3 Low Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Learning curve for ACS SDK | Low | Low | Provide training, comprehensive documentation |
| Additional Azure costs | Low | Low | Monitor usage, set budget alerts |

---

## 7. Testing Strategy

### 7.1 Testing Phases

#### 7.1.1 Unit Testing
- Backend: Test ACS service methods, token generation, error handling
- Frontend: Test ACS chat service, event handlers, state management
- Target: 80% code coverage minimum

#### 7.1.2 Integration Testing
- End-to-end ACS token flow: Auth → Token Request → ACS Initialization
- Chat thread creation: API → ACS → Database synchronization
- Real-time messaging: Multi-user scenarios with message delivery verification

#### 7.1.3 Performance Testing
- Concurrent user load testing (target: 1000+ users)
- Message throughput testing (target: 1000 messages/second)
- Latency measurement (target: <500ms end-to-end)

#### 7.1.4 User Acceptance Testing
- Feature parity verification (all SignalR features work with ACS)
- Cross-browser compatibility testing
- Mobile responsiveness testing

### 7.2 Test Environments

#### 7.2.1 Development Environment
- Local ACS resource for individual development
- Mock ACS services for isolated testing
- Automated unit and integration tests

#### 7.2.2 Staging Environment
- Full ACS deployment mirroring production
- Performance and load testing
- User acceptance testing

#### 7.2.3 Production Environment
- Gradual rollout with feature flags
- Real user monitoring and analytics
- Automated canary deployments

### 7.3 Test Cases

#### 7.3.1 Core Functionality Tests
- User authentication and ACS token generation
- Chat thread creation between users
- Real-time message sending and receiving
- Typing indicators and presence
- Read receipts and message status
- Message history and pagination

#### 7.3.2 Edge Case Tests
- Network disconnection and reconnection
- Token expiration and refresh
- Multiple concurrent users
- Large message volumes
- Special characters and emojis
- File attachment handling (future)

#### 7.3.3 Error Handling Tests
- ACS service unavailability
- Invalid tokens and authentication failures
- Network timeouts and retries
- Database connection issues
- CORS and security violations

---

## 8. Rollback Plan

### 8.1 Rollback Triggers

- Message delivery failure rate > 5%
- User-reported issues > 10 in first 24 hours
- Performance degradation > 50% increase in latency
- Critical security vulnerability discovered

### 8.2 Rollback Strategy

#### 8.2.1 Immediate Rollback (Feature Flag)
```csharp
// Feature flag in configuration
"Features": {
  "UseAcs": false  // Set to false to rollback
}

// Code with feature flag
if (_configuration.GetValue<bool>("Features:UseAcs"))
{
    // Use ACS logic
}
else
{
    // Use SignalR logic
}
```

#### 8.2.2 Full Rollback (Code Revert)
1. **Database**: ACS fields remain (no data loss)
2. **Backend**: Revert to SignalR implementation
3. **Frontend**: Revert to SignalR client
4. **Configuration**: Remove ACS settings
5. **Deployment**: Redeploy with SignalR version

### 8.3 Rollback Timeline

- **Detection**: < 5 minutes (monitoring alerts)
- **Decision**: < 15 minutes (engineering team review)
- **Execution**: < 30 minutes (automated deployment)
- **Verification**: < 60 minutes (smoke tests and monitoring)

### 8.4 Rollback Validation

- All chat functionality restored
- No message loss during rollback
- User sessions maintained where possible
- Performance metrics return to baseline

---

## 9. Success Criteria

### 9.1 Functional Success Criteria

- ✅ **Zero Message Loss**: All messages sent during migration are delivered
- ✅ **Feature Parity**: All SignalR features work with ACS (typing, read receipts, presence)
- ✅ **Real-time Performance**: Message delivery < 500ms latency
- ✅ **User Experience**: No degradation in chat responsiveness
- ✅ **Cross-platform**: Works on all supported browsers and devices

### 9.2 Technical Success Criteria

- ✅ **Code Quality**: 80%+ test coverage, no critical security issues
- ✅ **Performance**: < 50% increase in resource usage
- ✅ **Scalability**: Support for 1000+ concurrent users
- ✅ **Reliability**: 99.9% uptime during and after migration
- ✅ **Maintainability**: Clean, documented code following team standards

### 9.3 Business Success Criteria

- ✅ **User Adoption**: > 95% of users successfully using new system
- ✅ **Cost Efficiency**: Azure costs within budgeted amounts
- ✅ **Time to Market**: Migration completed within 3 weeks
- ✅ **Team Productivity**: Development velocity maintained or improved

### 9.4 Monitoring Success Criteria

- ✅ **Observability**: Comprehensive logging and metrics in place
- ✅ **Alerting**: Proactive monitoring with appropriate thresholds
- ✅ **Incident Response**: < 15 minute mean time to resolution
- ✅ **Continuous Improvement**: Feedback loop for ongoing optimization

---

## 10. Timeline

### 10.1 Phase 1: Foundation (Week 1)

**Day 1-2: Backend ACS Integration**
- Update dependencies and project structure
- Implement AzureCommunicationService
- Update AuthService for ACS token management
- Database schema updates

**Day 3-4: Business Logic Updates**
- Modify ChatService for ACS thread management
- Update API controllers
- Implement error handling and logging

**Day 5: Testing & Validation**
- Unit tests for ACS services
- Integration tests for token flow
- Code review and documentation

### 10.2 Phase 2: Frontend Integration (Week 2)

**Day 1-2: ACS Frontend Service**
- Implement AcsChatService
- Update chat context and hooks
- Real-time event handling

**Day 3-4: Component Updates**
- Update chat components for ACS
- Implement typing indicators and read receipts
- Error handling and reconnection logic

**Day 5: End-to-End Testing**
- Full integration testing
- Performance testing
- Cross-browser validation

### 10.3 Phase 3: Deployment & Optimization (Week 3)

**Day 1-2: Configuration & Deployment**
- Update deployment scripts for ACS
- Configure production environments
- Security and compliance checks

**Day 3-4: Production Migration**
- Staging environment testing
- Gradual production rollout
- Monitoring and alerting setup

**Day 5: Post-Migration**
- Performance monitoring
- User feedback collection
- Documentation updates

### 10.4 Key Milestones

- **End of Week 1**: ACS backend services fully implemented and tested
- **End of Week 2**: Frontend ACS integration complete, full system testing
- **End of Week 3**: Production deployment successful, monitoring active

### 10.5 Dependencies

- **Azure Resources**: ACS resource provisioning (1-2 days lead time)
- **Team Availability**: Full team availability during migration weeks
- **Testing Environment**: Staging environment ready before Week 3
- **Security Review**: Security team review completed before production

---

## 11. Appendices

### 11.1 Glossary

- **ACS**: Azure Communication Services
- **SignalR**: ASP.NET Core library for real-time web functionality
- **WebSocket**: Protocol for full-duplex communication over TCP
- **JWT**: JSON Web Token for authentication
- **Entra ID**: Microsoft Entra ID (formerly Azure AD)
- **SDK**: Software Development Kit

### 11.2 References

- [Azure Communication Services Documentation](https://docs.microsoft.com/azure/communication-services)
- [ACS Chat SDK Reference](https://docs.microsoft.com/azure/communication-services/sdk/chat)
- [SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)
- [Azure Architecture Center](https://docs.microsoft.com/azure/architecture)

### 11.3 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | GitHub Copilot | Initial draft |

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | | | |
| Product Manager | | | |
| DevOps Lead | | | |
| Security Lead | | | |

---

*This document is confidential and intended for authorized personnel only. Unauthorized distribution is prohibited.*