# Simple 1-on-1 Chat Application - Design Document

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Architecture Design](#3-architecture-design)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Design](#6-database-design)
7. [Azure Services Integration](#7-azure-services-integration)
8. [Local Development & Testing](#8-local-development--testing)
9. [Security Design](#9-security-design)
10. [Deployment Architecture](#10-deployment-architecture)
11. [API Design](#11-api-design)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Error Handling & Logging](#13-error-handling--logging)
14. [Performance Considerations](#14-performance-considerations)
15. [Appendix](#15-appendix)

---

## 1. Introduction

### 1.1 Purpose
This design document provides a detailed technical specification for the Simple 1-on-1 Chat Application. It describes the system architecture, component interactions, data flows, and implementation details necessary for development teams to build and maintain the application.

### 1.2 Scope
The application is a web-based real-time messaging platform that enables authenticated users to:
- Sign in using Microsoft Entra ID
- Search for other users
- Start one-on-one chat conversations
- Send and receive text messages in real-time
- See typing indicators and read receipts
- View user presence (online/offline)

**Out of Scope:**
- Group chats
- Voice/video calling
- File sharing
- Message editing/deletion
- Mobile native apps (iOS/Android)

### 1.3 Target Audience
- Software developers (frontend and backend)
- DevOps engineers
- QA engineers
- Technical architects
- Project managers

### 1.4 Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 18+ |
| Frontend Language | TypeScript | 5+ |
| UI Library | Material-UI (MUI) | 5+ |
| Backend Framework | ASP.NET Core Web API | 8.0 |
| Backend Language | C# | 12 |
| Database | SQL Server / PostgreSQL | Latest |
| ORM | Entity Framework Core | 8.0 |
| Authentication | Microsoft Entra ID | - |
| Communication Service | Azure Communication Services | Latest |
| Hosting (Frontend) | Azure Static Web Apps | - |
| Hosting (Backend) | Azure App Service | - |
| Monitoring | Application Insights | - |

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         End Users                            │
│                     (Web Browsers)                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   Azure Static Web Apps                      │
│                    (React Frontend)                          │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   MSAL     │  │ ACS Chat   │  │   React Components   │  │
│  │ Auth Layer │  │    SDK     │  │   (UI/State Mgmt)    │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ HTTPS/REST
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   Azure App Service                          │
│                  (.NET Core Web API)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Controllers Layer                     │ │
│  │  AuthController | UserController | ChatController     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Business Logic Layer                      │ │
│  │  AuthService | UserService | ChatService | ACSService │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Data Access Layer                         │ │
│  │  Repository Pattern | EF Core | DbContext             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────────┬──────────────────────────┘
                     │              │
                     │              │
        ┌────────────▼────┐    ┌────▼──────────────────┐
        │  Azure SQL DB   │    │   External Services   │
        │  (or PostgreSQL)│    │                       │
        │                 │    │  - Entra ID (Auth)    │
        │  - Users        │    │  - ACS (Chat/Identity)│
        │  - Conversations│    │  - App Insights (Log) │
        │  - Messages     │    │  - Graph API (Users)  │
        │  - Receipts     │    │                       │
        └─────────────────┘    └───────────────────────┘
```

### 2.2 System Components

#### 2.2.1 Frontend (React SPA)
- **Purpose**: User interface and client-side logic
- **Responsibilities**:
  - User authentication via MSAL
  - Real-time chat UI
  - State management
  - ACS Chat SDK integration
  - User presence display

#### 2.2.2 Backend (ASP.NET Core API)
- **Purpose**: Business logic and data management
- **Responsibilities**:
  - Token validation (Entra ID)
  - ACS token generation
  - Chat thread management
  - User management
  - Database operations
  - API endpoints

#### 2.2.3 Database (SQL Server/PostgreSQL)
- **Purpose**: Persistent data storage
- **Responsibilities**:
  - User profiles
  - Conversation metadata
  - Message history
  - Read receipts
  - User presence

#### 2.2.4 Azure Communication Services
- **Purpose**: Real-time chat infrastructure
- **Responsibilities**:
  - Chat thread management
  - Real-time message delivery
  - User identity management
  - Access token generation

#### 2.2.5 Microsoft Entra ID
- **Purpose**: Identity and access management
- **Responsibilities**:
  - User authentication
  - OAuth 2.0 / OpenID Connect
  - Token issuance
  - MFA support

### 2.3 Communication Patterns

#### 2.3.1 Frontend ↔ Backend
- **Protocol**: HTTPS/REST
- **Format**: JSON
- **Authentication**: Bearer token (JWT from Entra ID)
- **Pattern**: Request/Response

#### 2.3.2 Backend ↔ Database
- **Protocol**: SQL over TLS
- **ORM**: Entity Framework Core
- **Pattern**: Repository pattern with async operations

#### 2.3.3 Frontend ↔ ACS
- **Protocol**: HTTPS/WebSocket
- **SDK**: @azure/communication-chat
- **Pattern**: Event-driven (real-time messages)

#### 2.3.4 Backend ↔ ACS
- **Protocol**: HTTPS/REST
- **SDK**: Azure.Communication.Identity, Azure.Communication.Chat
- **Pattern**: Request/Response

### 2.4 Key Design Principles

1. **Separation of Concerns**: Clear separation between UI, business logic, and data access
2. **Stateless API**: Backend API is stateless for scalability
3. **Security First**: Authentication/authorization on every request
4. **Real-time First**: Use ACS for real-time messaging, database for persistence
5. **Fail Fast**: Validate early, provide clear error messages
6. **Testability**: Dependency injection and interfaces for easy testing
7. **Scalability**: Horizontal scaling capability for both frontend and backend

---

## 3. Architecture Design

### 3.1 Architectural Style
The application follows a **Three-Tier Architecture** pattern:

1. **Presentation Tier**: React SPA (client-side rendering)
2. **Application Tier**: ASP.NET Core Web API (RESTful services)
3. **Data Tier**: SQL Server/PostgreSQL (relational database)

Additionally, it incorporates:
- **Microservices Pattern**: External services (Entra ID, ACS) provide specific capabilities
- **Event-Driven Architecture**: ACS provides real-time events for chat messages
- **Repository Pattern**: Abstraction layer for data access

### 3.2 System Context Diagram

```
                    ┌──────────────────┐
                    │   End User       │
                    │  (Web Browser)   │
                    └────────┬─────────┘
                             │
                             │ Uses
                             ▼
            ┌────────────────────────────────┐
            │                                │
            │   Simple Chat Application      │
            │                                │
            │  ┌──────────┐  ┌───────────┐  │
            │  │ Frontend │  │  Backend  │  │
            │  │  (React) │──│  (.NET)   │  │
            │  └──────────┘  └───────────┘  │
            │                                │
            └─────┬────────┬──────────┬──────┘
                  │        │          │
         ┌────────┘        │          └──────────┐
         │                 │                     │
         ▼                 ▼                     ▼
┌─────────────────┐ ┌─────────────┐   ┌──────────────────┐
│  Microsoft      │ │   Azure     │   │   Azure SQL      │
│  Entra ID       │ │Communication│   │   Database       │
│                 │ │  Services   │   │                  │
│ - Authentication│ │ - Chat      │   │ - Data Storage   │
│ - User Identity │ │ - Real-time │   │ - Persistence    │
└─────────────────┘ └─────────────┘   └──────────────────┘
```

### 3.3 Container Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Single Page Application               │  │
│  │                                                       │  │
│  │  - MSAL for Authentication                           │  │
│  │  - Material-UI Components                            │  │
│  │  - ACS Chat SDK                                      │  │
│  │  - State Management (Context API)                    │  │
│  │  - React Router                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/JSON
                        │ Bearer Token
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ASP.NET Core Web API (Azure App Service)       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 API Controllers                       │  │
│  │  [Authorize] AuthController, UserController, etc.    │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │               Service Layer                          │  │
│  │  IAuthService, IUserService, IChatService, etc.      │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │            Repository Layer                          │  │
│  │  IUserRepository, IChatRepository, etc.              │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │            DbContext (EF Core)                       │  │
│  │  Entity Mappings, Migrations, Change Tracking        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────┬────────────┬────────────────────────────┘
                    │            │
        ┌───────────▼──┐    ┌────▼──────────────┐
        │  Azure SQL   │    │  External APIs    │
        │  Database    │    │  - Entra ID       │
        │              │    │  - ACS            │
        │              │    │  - Graph API      │
        └──────────────┘    └───────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Technology Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite or Create React App
- **State Management**: React Context API
- **Routing**: React Router v6
- **UI Framework**: Material-UI (MUI) v5
- **HTTP Client**: Axios
- **Authentication**: @azure/msal-react, @azure/msal-browser
- **Chat SDK**: @azure/communication-chat, @azure/communication-common
- **Form Validation**: React Hook Form (optional)
- **Date/Time**: date-fns or dayjs

### 4.2 Project Structure

```
chat-app-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │       └── global.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginButton.tsx
│   │   │   ├── LogoutButton.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatListItem.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── EmojiPicker.tsx
│   │   ├── user/
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   ├── UserSearch.tsx
│   │   │   └── UserPresence.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── NotificationBanner.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── UserContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useUsers.ts
│   │   └── usePresence.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── authApi.ts
│   │   │   ├── userApi.ts
│   │   │   ├── chatApi.ts
│   │   │   └── axiosConfig.ts
│   │   ├── acs/
│   │   │   ├── chatService.ts
│   │   │   └── chatEventHandlers.ts
│   │   └── msal/
│   │       └── msalConfig.ts
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── chat.types.ts
│   │   ├── message.types.ts
│   │   └── api.types.ts
│   ├── utils/
│   │   ├── dateFormatter.ts
│   │   ├── errorHandler.ts
│   │   └── constants.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── App.tsx
│   ├── index.tsx
│   └── vite-env.d.ts
├── .env.local
├── .env.production
├── package.json
├── tsconfig.json
└── vite.config.ts (or craco.config.js)
```

### 4.3 Component Architecture

#### 4.3.1 Component Hierarchy

```
App
├── MsalProvider (from @azure/msal-react)
│   └── AuthProvider (Context)
│       └── Router
│           ├── ProtectedRoute
│           │   └── HomePage
│           │       ├── Header
│           │       ├── Sidebar
│           │       │   └── ChatList
│           │       │       └── ChatListItem[]
│           │       └── ChatWindow
│           │           ├── ChatHeader
│           │           │   ├── UserAvatar
│           │           │   └── UserPresence
│           │           ├── MessageList
│           │           │   ├── MessageBubble[]
│           │           │   └── TypingIndicator
│           │           └── MessageInput
│           │               └── EmojiPicker
│           ├── ProtectedRoute
│           │   └── ProfilePage
│           │       ├── Header
│           │       └── UserProfile
│           └── Public Routes
│               └── LoginPage
└── ErrorBoundary
```

#### 4.3.2 Key Components Detail

**ChatList Component**
```typescript
// ChatList.tsx
interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect
}) => {
  const sortedConversations = useMemo(() => 
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    ), [conversations]
  );

  return (
    <List>
      {sortedConversations.map(conv => (
        <ChatListItem
          key={conv.id}
          conversation={conv}
          isSelected={conv.id === selectedConversationId}
          onClick={() => onConversationSelect(conv.id)}
        />
      ))}
    </List>
  );
};
```

**ChatWindow Component**
```typescript
// ChatWindow.tsx
interface ChatWindowProps {
  conversationId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const { messages, sendMessage, loadMoreMessages } = useChat(conversationId);
  const [newMessage, setNewMessage] = useState('');
  
  const handleSend = async () => {
    if (newMessage.trim()) {
      await sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChatHeader conversationId={conversationId} />
      <MessageList 
        messages={messages} 
        onLoadMore={loadMoreMessages} 
      />
      <MessageInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={handleSend}
      />
    </Box>
  );
};
```

### 4.4 State Management

#### 4.4.1 Context API Structure

**AuthContext**
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  getAcsToken: () => Promise<string>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [acsToken, setAcsToken] = useState<string | null>(null);

  // Implementation details...
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**ChatContext**
```typescript
// contexts/ChatContext.tsx
interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  createConversation: (userId: string) => Promise<Conversation>;
  loadMessages: (conversationId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { chatClient } = useAcsChat();

  // Real-time event handlers
  useEffect(() => {
    if (chatClient) {
      chatClient.on('chatMessageReceived', handleMessageReceived);
      chatClient.on('typingIndicatorReceived', handleTypingIndicator);
      chatClient.on('readReceiptReceived', handleReadReceipt);
      
      return () => {
        chatClient.off('chatMessageReceived', handleMessageReceived);
        chatClient.off('typingIndicatorReceived', handleTypingIndicator);
        chatClient.off('readReceiptReceived', handleReadReceipt);
      };
    }
  }, [chatClient]);

  // Implementation...
};
```

### 4.5 MSAL Configuration

```typescript
// services/msal/msalConfig.ts
import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

export const apiRequest = {
  scopes: [`api://${import.meta.env.VITE_ENTRA_CLIENT_ID}/access_as_user`],
};
```

### 4.6 ACS Chat SDK Integration

```typescript
// services/acs/chatService.ts
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

export class AcsChatService {
  private chatClient: ChatClient | null = null;

  async initialize(acsToken: string, endpoint: string): Promise<ChatClient> {
    const tokenCredential = new AzureCommunicationTokenCredential(acsToken);
    
    this.chatClient = new ChatClient(endpoint, tokenCredential);
    
    // Start real-time notifications
    await this.chatClient.startRealtimeNotifications();
    
    return this.chatClient;
  }

  async sendMessage(threadId: string, content: string): Promise<void> {
    if (!this.chatClient) throw new Error('Chat client not initialized');
    
    const chatThreadClient = this.chatClient.getChatThreadClient(threadId);
    await chatThreadClient.sendMessage({ content });
  }

  async sendTypingNotification(threadId: string): Promise<void> {
    if (!this.chatClient) throw new Error('Chat client not initialized');
    
    const chatThreadClient = this.chatClient.getChatThreadClient(threadId);
    await chatThreadClient.sendTypingNotification();
  }

  async sendReadReceipt(threadId: string, messageId: string): Promise<void> {
    if (!this.chatClient) throw new Error('Chat client not initialized');
    
    const chatThreadClient = this.chatClient.getChatThreadClient(threadId);
    await chatThreadClient.sendReadReceipt({ chatMessageId: messageId });
  }

  dispose(): void {
    this.chatClient?.stopRealtimeNotifications();
    this.chatClient = null;
  }
}
```

### 4.7 API Service Layer

```typescript
// services/api/axiosConfig.ts
import axios from 'axios';
import { msalInstance } from '../msal/msalConfig';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length > 0) {
    const request = {
      scopes: [`api://${import.meta.env.VITE_ENTRA_CLIENT_ID}/access_as_user`],
      account: accounts[0],
    };
    
    try {
      const response = await msalInstance.acquireTokenSilent(request);
      config.headers.Authorization = `Bearer ${response.accessToken}`;
    } catch (error) {
      // Token acquisition failed, redirect to login
      await msalInstance.acquireTokenRedirect(request);
    }
  }
  
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      msalInstance.loginRedirect();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// services/api/chatApi.ts
import apiClient from './axiosConfig';
import { Conversation, Message, CreateConversationRequest } from '../../types';

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>('/api/conversations');
    return response.data;
  },

  createConversation: async (userId: string): Promise<Conversation> => {
    const response = await apiClient.post<Conversation>('/api/conversations', {
      participantUserId: userId,
    });
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(
      `/api/conversations/${conversationId}/messages`,
      { params: { page, pageSize } }
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<Message> => {
    const response = await apiClient.post<Message>(
      `/api/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/api/conversations/${conversationId}/read`);
  },
};
```

### 4.8 Routing Configuration

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './services/msal/msalConfig';

const App: React.FC = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:conversationId"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </MsalProvider>
  );
};
```

---

## 5. Backend Architecture

### 5.1 Technology Stack
- **Framework**: ASP.NET Core 8.0 Web API
- **Language**: C# 12
- **ORM**: Entity Framework Core 8.0
- **Database**: SQL Server 2022 or PostgreSQL 15+
- **Authentication**: Microsoft.Identity.Web
- **Azure SDKs**:
  - Azure.Communication.Identity
  - Azure.Communication.Chat
  - Microsoft.Graph (for user info)
- **Logging**: Serilog + Application Insights
- **API Documentation**: Swashbuckle (Swagger)
- **Testing**: xUnit, Moq, FluentAssertions

### 5.2 Project Structure

```
ChatApp.API/
├── ChatApp.API/                    # Main API project
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── UserController.cs
│   │   └── ChatController.cs
│   ├── Middleware/
│   │   ├── ExceptionHandlingMiddleware.cs
│   │   └── RequestLoggingMiddleware.cs
│   ├── Program.cs
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── appsettings.Production.json
├── ChatApp.Core/                   # Domain layer
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Conversation.cs
│   │   ├── Participant.cs
│   │   ├── Message.cs
│   │   ├── MessageReceipt.cs
│   │   └── UserPresence.cs
│   ├── Interfaces/
│   │   ├── IUserRepository.cs
│   │   ├── IChatRepository.cs
│   │   └── IUnitOfWork.cs
│   ├── DTOs/
│   │   ├── Requests/
│   │   │   ├── CreateConversationRequest.cs
│   │   │   ├── SendMessageRequest.cs
│   │   │   └── UpdateProfileRequest.cs
│   │   └── Responses/
│   │       ├── ConversationDto.cs
│   │       ├── MessageDto.cs
│   │       └── UserDto.cs
│   └── Exceptions/
│       ├── NotFoundException.cs
│       ├── UnauthorizedException.cs
│       └── ValidationException.cs
├── ChatApp.Infrastructure/         # Infrastructure layer
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   ├── Configurations/
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── ConversationConfiguration.cs
│   │   │   └── MessageConfiguration.cs
│   │   ├── Migrations/
│   │   └── Repositories/
│   │       ├── UserRepository.cs
│   │       ├── ChatRepository.cs
│   │       └── UnitOfWork.cs
│   ├── Services/
│   │   ├── AzureCommunicationService.cs
│   │   ├── EntraIdService.cs
│   │   └── StorageService.cs
│   └── Extensions/
│       └── ServiceCollectionExtensions.cs
├── ChatApp.Application/            # Application layer
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── IUserService.cs
│   │   │   └── IChatService.cs
│   │   └── Implementations/
│   │       ├── AuthService.cs
│   │       ├── UserService.cs
│   │       └── ChatService.cs
│   ├── Mappings/
│   │   └── AutoMapperProfile.cs
│   └── Validators/
│       ├── CreateConversationValidator.cs
│       └── SendMessageValidator.cs
└── ChatApp.Tests/                  # Test projects
    ├── ChatApp.UnitTests/
    ├── ChatApp.IntegrationTests/
    └── ChatApp.ApiTests/
```

### 5.3 Layered Architecture

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer                    │
│         (API Controllers)                       │
│  - AuthController                               │
│  - UserController                               │
│  - ChatController                               │
│  - Handles HTTP requests/responses              │
│  - Input validation                             │
│  - Authentication/Authorization                 │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│          Application Layer                      │
│          (Business Logic)                       │
│  - IAuthService → AuthService                   │
│  - IUserService → UserService                   │
│  - IChatService → ChatService                   │
│  - DTOs, Mappings, Validators                   │
│  - Orchestrates domain & infrastructure         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│            Domain Layer                         │
│          (Core Entities)                        │
│  - User, Conversation, Message                  │
│  - Repository Interfaces                        │
│  - Domain Exceptions                            │
│  - No dependencies on other layers              │
└─────────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│        Infrastructure Layer                     │
│    (External Dependencies)                      │
│  - EF Core DbContext                            │
│  - Repository Implementations                   │
│  - Azure Communication Service                  │
│  - Entra ID Service                             │
│  - Database Migrations                          │
└─────────────────────────────────────────────────┘
```

### 5.4 Controllers

#### 5.4.1 AuthController

```csharp
// Controllers/AuthController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Initialize user in database on first login (auto-triggered)
    /// </summary>
    [HttpPost("initialize")]
    public async Task<ActionResult<UserDto>> InitializeUser()
    {
        var entraUserId = User.FindFirst("oid")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(entraUserId))
            return Unauthorized("Invalid token");

        var user = await _authService.InitializeUserAsync(entraUserId);
        return Ok(user);
    }

    /// <summary>
    /// Get ACS access token for the authenticated user
    /// </summary>
    [HttpGet("acs-token")]
    public async Task<ActionResult<AcsTokenResponse>> GetAcsToken()
    {
        var userId = User.FindFirst("oid")?.Value;
        
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var tokenResponse = await _authService.GetAcsTokenAsync(userId);
        return Ok(tokenResponse);
    }

    /// <summary>
    /// Get current authenticated user details
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst("oid")?.Value;
        var user = await _authService.GetUserByEntraIdAsync(userId);
        
        if (user == null)
            return NotFound();

        return Ok(user);
    }
}
```

#### 5.4.2 UserController

```csharp
// Controllers/UserController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Search users by name or email
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserDto>>> SearchUsers(
        [FromQuery] string query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return BadRequest("Query must be at least 2 characters");

        var users = await _userService.SearchUsersAsync(query, page, pageSize);
        return Ok(users);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid userId)
    {
        var user = await _userService.GetUserByIdAsync(userId);
        
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    /// <summary>
    /// Update current user's profile
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request)
    {
        var entraUserId = User.FindFirst("oid")?.Value;
        var user = await _userService.UpdateProfileAsync(entraUserId, request);
        
        return Ok(user);
    }

    /// <summary>
    /// Upload profile picture
    /// </summary>
    [HttpPost("me/avatar")]
    public async Task<ActionResult<string>> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        if (file.Length > 5 * 1024 * 1024) // 5MB
            return BadRequest("File size must be less than 5MB");

        var entraUserId = User.FindFirst("oid")?.Value;
        var avatarUrl = await _userService.UploadAvatarAsync(entraUserId, file);
        
        return Ok(new { avatarUrl });
    }

    /// <summary>
    /// Get user presence status
    /// </summary>
    [HttpGet("{userId:guid}/presence")]
    public async Task<ActionResult<UserPresenceDto>> GetPresence(Guid userId)
    {
        var presence = await _userService.GetPresenceAsync(userId);
        return Ok(presence);
    }
}
```

#### 5.4.3 ChatController

```csharp
// Controllers/ChatController.cs
[ApiController]
[Route("api/conversations")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    /// <summary>
    /// Get all conversations for current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConversationDto>>> GetConversations()
    {
        var entraUserId = User.FindFirst("oid")?.Value;
        var conversations = await _chatService.GetUserConversationsAsync(entraUserId);
        
        return Ok(conversations);
    }

    /// <summary>
    /// Create new 1-on-1 conversation
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ConversationDto>> CreateConversation(
        [FromBody] CreateConversationRequest request)
    {
        var entraUserId = User.FindFirst("oid")?.Value;
        var conversation = await _chatService.CreateConversationAsync(
            entraUserId, 
            request.ParticipantUserId
        );
        
        return CreatedAtAction(
            nameof(GetConversation),
            new { conversationId = conversation.Id },
            conversation
        );
    }

    /// <summary>
    /// Get conversation by ID
    /// </summary>
    [HttpGet("{conversationId:guid}")]
    public async Task<ActionResult<ConversationDto>> GetConversation(Guid conversationId)
    {
        var conversation = await _chatService.GetConversationAsync(conversationId);
        
        if (conversation == null)
            return NotFound();

        return Ok(conversation);
    }

    /// <summary>
    /// Get messages for a conversation
    /// </summary>
    [HttpGet("{conversationId:guid}/messages")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(
        Guid conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var messages = await _chatService.GetMessagesAsync(
            conversationId, 
            page, 
            pageSize
        );
        
        return Ok(messages);
    }

    /// <summary>
    /// Send message in a conversation
    /// </summary>
    [HttpPost("{conversationId:guid}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageRequest request)
    {
        var entraUserId = User.FindFirst("oid")?.Value;
        
        var message = await _chatService.SendMessageAsync(
            conversationId,
            entraUserId,
            request.Content
        );
        
        return CreatedAtAction(
            nameof(GetMessages),
            new { conversationId },
            message
        );
    }

    /// <summary>
    /// Mark messages as read
    /// </summary>
    [HttpPost("{conversationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid conversationId)
    {
        var entraUserId = User.FindFirst("oid")?.Value;
        await _chatService.MarkAsReadAsync(conversationId, entraUserId);
        
        return NoContent();
    }
}
```

### 5.5 Services

#### 5.5.1 IAuthService & Implementation

```csharp
// Application/Services/Interfaces/IAuthService.cs
public interface IAuthService
{
    Task<UserDto> InitializeUserAsync(string entraUserId);
    Task<UserDto> GetUserByEntraIdAsync(string entraUserId);
    Task<AcsTokenResponse> GetAcsTokenAsync(string entraUserId);
}

// Application/Services/Implementations/AuthService.cs
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IAzureCommunicationService _acsService;
    private readonly IEntraIdService _entraIdService;
    private readonly IMapper _mapper;

    public AuthService(
        IUserRepository userRepository,
        IAzureCommunicationService acsService,
        IEntraIdService entraIdService,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _acsService = acsService;
        _entraIdService = entraIdService;
        _mapper = mapper;
    }

    public async Task<UserDto> InitializeUserAsync(string entraUserId)
    {
        // Check if user already exists
        var existingUser = await _userRepository.GetByEntraIdAsync(entraUserId);
        if (existingUser != null)
            return _mapper.Map<UserDto>(existingUser);

        // Get user info from Microsoft Graph
        var graphUser = await _entraIdService.GetUserAsync(entraUserId);

        // Create ACS identity
        var acsIdentity = await _acsService.CreateIdentityAsync();

        // Create user in our database
        var user = new User
        {
            Id = Guid.NewGuid(),
            EntraIdObjectId = entraUserId,
            Email = graphUser.Mail ?? graphUser.UserPrincipalName,
            DisplayName = graphUser.DisplayName,
            AcsIdentity = acsIdentity.Id,
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

        var token = await _acsService.GetTokenAsync(
            user.AcsIdentity,
            new[] { "chat", "voip" }
        );

        return new AcsTokenResponse
        {
            Token = token.Token,
            ExpiresOn = token.ExpiresOn,
            AcsUserId = user.AcsIdentity
        };
    }
}
```

#### 5.5.2 IChatService & Implementation

```csharp
// Application/Services/Interfaces/IChatService.cs
public interface IChatService
{
    Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string entraUserId);
    Task<ConversationDto> CreateConversationAsync(string creatorEntraId, Guid participantUserId);
    Task<ConversationDto> GetConversationAsync(Guid conversationId);
    Task<IEnumerable<MessageDto>> GetMessagesAsync(Guid conversationId, int page, int pageSize);
    Task<MessageDto> SendMessageAsync(Guid conversationId, string senderEntraId, string content);
    Task MarkAsReadAsync(Guid conversationId, string readerEntraId);
}

// Application/Services/Implementations/ChatService.cs
public class ChatService : IChatService
{
    private readonly IChatRepository _chatRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAzureCommunicationService _acsService;
    private readonly IMapper _mapper;

    public ChatService(
        IChatRepository chatRepository,
        IUserRepository userRepository,
        IAzureCommunicationService acsService,
        IMapper mapper)
    {
        _chatRepository = chatRepository;
        _userRepository = userRepository;
        _acsService = acsService;
        _mapper = mapper;
    }

    public async Task<ConversationDto> CreateConversationAsync(
        string creatorEntraId,
        Guid participantUserId)
    {
        var creator = await _userRepository.GetByEntraIdAsync(creatorEntraId);
        var participant = await _userRepository.GetByIdAsync(participantUserId);

        if (participant == null)
            throw new NotFoundException("Participant not found");

        // Check if conversation already exists
        var existing = await _chatRepository.FindConversationBetweenUsersAsync(
            creator.Id,
            participantUserId
        );

        if (existing != null)
            return _mapper.Map<ConversationDto>(existing);

        // Create ACS chat thread
        var threadId = await _acsService.CreateChatThreadAsync(
            $"{creator.DisplayName} and {participant.DisplayName}",
            new[] { creator.AcsIdentity, participant.AcsIdentity }
        );

        // Create conversation in database
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            AcsChatThreadId = threadId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = creator.Id
        };

        conversation.Participants = new List<Participant>
        {
            new() { UserId = creator.Id, JoinedAt = DateTime.UtcNow },
            new() { UserId = participantUserId, JoinedAt = DateTime.UtcNow }
        };

        await _chatRepository.AddConversationAsync(conversation);
        await _chatRepository.SaveChangesAsync();

        return _mapper.Map<ConversationDto>(conversation);
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid conversationId,
        string senderEntraId,
        string content)
    {
        var sender = await _userRepository.GetByEntraIdAsync(senderEntraId);
        var conversation = await _chatRepository.GetConversationByIdAsync(conversationId);

        if (conversation == null)
            throw new NotFoundException("Conversation not found");

        // Send via ACS
        var acsMessageId = await _acsService.SendMessageAsync(
            conversation.AcsChatThreadId,
            sender.AcsIdentity,
            content
        );

        // Save to database
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = sender.Id,
            AcsMessageId = acsMessageId,
            Content = content,
            SentAt = DateTime.UtcNow
        };

        await _chatRepository.AddMessageAsync(message);
        await _chatRepository.SaveChangesAsync();

        return _mapper.Map<MessageDto>(message);
    }
}
```

### 5.6 Repository Pattern

```csharp
// Core/Interfaces/IUserRepository.cs
public interface IUserRepository
{
    Task<User> GetByIdAsync(Guid id);
    Task<User> GetByEntraIdAsync(string entraObjectId);
    Task<IEnumerable<User>> SearchAsync(string query, int page, int pageSize);
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task SaveChangesAsync();
}

// Infrastructure/Data/Repositories/UserRepository.cs
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User> GetByEntraIdAsync(string entraObjectId)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.EntraIdObjectId == entraObjectId);
    }

    public async Task<IEnumerable<User>> SearchAsync(
        string query,
        int page,
        int pageSize)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => 
                u.DisplayName.Contains(query) || 
                u.Email.Contains(query))
            .OrderBy(u => u.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
```

### 5.7 Dependency Injection Configuration

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services to container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();

// Register application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IChatService, ChatService>();

// Register infrastructure services
builder.Services.AddScoped<IAzureCommunicationService, AzureCommunicationService>();
builder.Services.AddScoped<IEntraIdService, EntraIdService>();

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configure logging
builder.Services.AddApplicationInsightsTelemetry();

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## 6. Database Design

### 6.1 Database Schema

#### 6.1.1 Entity Relationship Diagram

```
┌─────────────────────────────┐
│          Users              │
│─────────────────────────────│
│ PK  Id (GUID)               │
│     EntraIdObjectId (unique)│
│     Email                   │
│     DisplayName             │
│     AvatarUrl               │
│     AcsIdentity             │
│     CreatedAt               │
│     LastSeen                │
└──────────────┬──────────────┘
               │
               │ 1:N
               │
┌──────────────▼──────────────┐         ┌──────────────────────────┐
│     Participants            │    N:1  │    Conversations         │
│─────────────────────────────│◄────────│──────────────────────────│
│ PK  Id (GUID)               │         │ PK  Id (GUID)            │
│ FK  ConversationId          │─────────┤     AcsChatThreadId      │
│ FK  UserId                  │         │     CreatedAt            │
│     JoinedAt                │         │ FK  CreatedBy            │
└─────────────────────────────┘         └──────────┬───────────────┘
                                                   │
                                                   │ 1:N
                                                   │
┌─────────────────────────────┐         ┌─────────▼────────────────┐
│     MessageReceipts         │    N:1  │       Messages           │
│─────────────────────────────│◄────────│──────────────────────────│
│ PK  Id (GUID)               │         │ PK  Id (GUID)            │
│ FK  MessageId               │─────────┤ FK  ConversationId       │
│ FK  UserId                  │         │ FK  SenderId             │
│     ReadAt                  │         │     AcsMessageId         │
└─────────────────────────────┘         │     Content              │
                                         │     SentAt               │
┌─────────────────────────────┐         └──────────────────────────┘
│      UserPresence           │
│─────────────────────────────│         ┌──────────────────────────┐
│ PK  Id (GUID)               │    1:1  │        Users             │
│ FK  UserId (unique)         │◄────────│                          │
│     IsOnline                │         └──────────────────────────┘
│     LastUpdated             │
└─────────────────────────────┘
```

#### 6.1.2 Table Definitions

**Users Table**
```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntraIdObjectId NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL,
    DisplayName NVARCHAR(100) NOT NULL,
    AvatarUrl NVARCHAR(500) NULL,
    AcsIdentity NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastSeen DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX IX_Users_EntraIdObjectId (EntraIdObjectId),
    INDEX IX_Users_Email (Email),
    INDEX IX_Users_DisplayName (DisplayName)
);
```

**Conversations Table**
```sql
CREATE TABLE Conversations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    AcsChatThreadId NVARCHAR(200) NOT NULL UNIQUE,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy UNIQUEIDENTIFIER NOT NULL,
    
    CONSTRAINT FK_Conversations_Users 
        FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE NO ACTION,
    
    INDEX IX_Conversations_AcsChatThreadId (AcsChatThreadId),
    INDEX IX_Conversations_CreatedAt (CreatedAt DESC)
);
```

**Participants Table**
```sql
CREATE TABLE Participants (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ConversationId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Participants_Conversations 
        FOREIGN KEY (ConversationId) REFERENCES Conversations(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Participants_Users 
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    
    CONSTRAINT UQ_Participants_ConversationUser UNIQUE (ConversationId, UserId),
    
    INDEX IX_Participants_UserId (UserId),
    INDEX IX_Participants_ConversationId (ConversationId)
);
```

**Messages Table**
```sql
CREATE TABLE Messages (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ConversationId UNIQUEIDENTIFIER NOT NULL,
    SenderId UNIQUEIDENTIFIER NOT NULL,
    AcsMessageId NVARCHAR(200) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Messages_Conversations 
        FOREIGN KEY (ConversationId) REFERENCES Conversations(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Messages_Users 
        FOREIGN KEY (SenderId) REFERENCES Users(Id) ON DELETE NO ACTION,
    
    INDEX IX_Messages_ConversationId_SentAt (ConversationId, SentAt DESC),
    INDEX IX_Messages_SenderId (SenderId),
    INDEX IX_Messages_AcsMessageId (AcsMessageId)
);
```

**MessageReceipts Table**
```sql
CREATE TABLE MessageReceipts (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    MessageId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    ReadAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_MessageReceipts_Messages 
        FOREIGN KEY (MessageId) REFERENCES Messages(Id) ON DELETE CASCADE,
    CONSTRAINT FK_MessageReceipts_Users 
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    
    CONSTRAINT UQ_MessageReceipts_MessageUser UNIQUE (MessageId, UserId),
    
    INDEX IX_MessageReceipts_MessageId (MessageId),
    INDEX IX_MessageReceipts_UserId (UserId)
);
```

**UserPresence Table**
```sql
CREATE TABLE UserPresence (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    IsOnline BIT NOT NULL DEFAULT 0,
    LastUpdated DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_UserPresence_Users 
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    
    INDEX IX_UserPresence_UserId (UserId),
    INDEX IX_UserPresence_IsOnline (IsOnline)
);
```

### 6.2 Entity Framework Core Configuration

```csharp
// Infrastructure/Data/Configurations/UserConfiguration.cs
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.EntraIdObjectId)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.HasIndex(u => u.EntraIdObjectId)
            .IsUnique();
        
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(u => u.DisplayName)
            .IsRequired()
            .HasMaxLength(100);
        
        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);
        
        builder.Property(u => u.AcsIdentity)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(u => u.CreatedAt)
            .IsRequired();
        
        builder.Property(u => u.LastSeen)
            .IsRequired();
        
        // Relationships
        builder.HasMany(u => u.Participants)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne(u => u.Presence)
            .WithOne(p => p.User)
            .HasForeignKey<UserPresence>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

### 6.3 Database Migrations

```bash
# Create initial migration
dotnet ef migrations add InitialCreate --project ChatApp.Infrastructure --startup-project ChatApp.API

# Update database
dotnet ef database update --project ChatApp.Infrastructure --startup-project ChatApp.API

# Generate SQL script for production
dotnet ef migrations script --project ChatApp.Infrastructure --startup-project ChatApp.API --output migration.sql
```

---

## 7. Azure Services Integration

### 7.1 Azure Communication Services

#### 7.1.1 ACS Service Implementation

```csharp
// Infrastructure/Services/AzureCommunicationService.cs
public interface IAzureCommunicationService
{
    Task<CommunicationUserIdentifier> CreateIdentityAsync();
    Task<AccessToken> GetTokenAsync(string identity, string[] scopes);
    Task<string> CreateChatThreadAsync(string topic, string[] participantIds);
    Task<string> SendMessageAsync(string threadId, string senderId, string content);
    Task AddParticipantAsync(string threadId, string participantId);
}

public class AzureCommunicationService : IAzureCommunicationService
{
    private readonly CommunicationIdentityClient _identityClient;
    private readonly ChatClient _chatClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureCommunicationService> _logger;

    public AzureCommunicationService(
        IConfiguration configuration,
        ILogger<AzureCommunicationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        
        var connectionString = configuration["AzureCommunicationServices:ConnectionString"];
        var endpoint = configuration["AzureCommunicationServices:Endpoint"];
        
        _identityClient = new CommunicationIdentityClient(connectionString);
        
        // For chat operations, we use endpoint + token
        // This is initialized per-user with their token
    }

    public async Task<CommunicationUserIdentifier> CreateIdentityAsync()
    {
        try
        {
            var identityResponse = await _identityClient.CreateUserAsync();
            _logger.LogInformation("Created ACS identity: {Identity}", identityResponse.Value.Id);
            return identityResponse.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create ACS identity");
            throw;
        }
    }

    public async Task<AccessToken> GetTokenAsync(string identity, string[] scopes)
    {
        try
        {
            var user = new CommunicationUserIdentifier(identity);
            var tokenScopes = scopes.Select(s => 
                s.ToLower() == "chat" ? CommunicationTokenScope.Chat : CommunicationTokenScope.VoIP
            );
            
            var tokenResponse = await _identityClient.GetTokenAsync(user, tokenScopes);
            
            _logger.LogInformation("Generated ACS token for identity: {Identity}", identity);
            
            return tokenResponse.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get ACS token for identity: {Identity}", identity);
            throw;
        }
    }

    public async Task<string> CreateChatThreadAsync(string topic, string[] participantIds)
    {
        try
        {
            // This would be called with a service-level token
            var connectionString = _configuration["AzureCommunicationServices:ConnectionString"];
            var chatClient = new ChatClient(new Uri(_configuration["AzureCommunicationServices:Endpoint"]),
                new AzureCommunicationTokenCredential(await GetServiceTokenAsync()));
            
            var participants = participantIds.Select(id => new ChatParticipant(
                new CommunicationUserIdentifier(id))
            {
                DisplayName = id
            }).ToList();
            
            var createThreadResult = await chatClient.CreateChatThreadAsync(topic, participants);
            var threadId = createThreadResult.Value.ChatThread.Id;
            
            _logger.LogInformation("Created chat thread: {ThreadId}", threadId);
            
            return threadId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create chat thread");
            throw;
        }
    }

    private async Task<string> GetServiceTokenAsync()
    {
        // Create a service-level identity for backend operations
        var serviceIdentity = await CreateIdentityAsync();
        var token = await GetTokenAsync(serviceIdentity.Id, new[] { "chat" });
        return token.Token;
    }
}
```

### 7.2 Microsoft Entra ID Integration

#### 7.2.1 Entra ID Service for User Info

```csharp
// Infrastructure/Services/EntraIdService.cs
public interface IEntraIdService
{
    Task<Microsoft.Graph.User> GetUserAsync(string userId);
    Task<byte[]> GetUserPhotoAsync(string userId);
}

public class EntraIdService : IEntraIdService
{
    private readonly GraphServiceClient _graphClient;
    private readonly ILogger<EntraIdService> _logger;

    public EntraIdService(
        IConfiguration configuration,
        ILogger<EntraIdService> logger)
    {
        _logger = logger;
        
        var clientId = configuration["AzureAd:ClientId"];
        var tenantId = configuration["AzureAd:TenantId"];
        var clientSecret = configuration["AzureAd:ClientSecret"];
        
        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        _graphClient = new GraphServiceClient(credential);
    }

    public async Task<Microsoft.Graph.User> GetUserAsync(string userId)
    {
        try
        {
            var user = await _graphClient.Users[userId]
                .Request()
                .Select(u => new
                {
                    u.Id,
                    u.DisplayName,
                    u.Mail,
                    u.UserPrincipalName,
                    u.GivenName,
                    u.Surname
                })
                .GetAsync();
            
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user from Graph API: {UserId}", userId);
            throw;
        }
    }

    public async Task<byte[]> GetUserPhotoAsync(string userId)
    {
        try
        {
            using var photoStream = await _graphClient.Users[userId]
                .Photo
                .Content
                .Request()
                .GetAsync();
            
            using var memoryStream = new MemoryStream();
            await photoStream.CopyToAsync(memoryStream);
            return memoryStream.ToArray();
        }
        catch (ServiceException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogInformation("No photo found for user: {UserId}", userId);
            return null;
        }
    }
}
```

### 7.3 Configuration

```json
// appsettings.json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-tenant-id>",
    "ClientId": "<your-client-id>",
    "ClientSecret": "<your-client-secret>",
    "Audience": "api://<your-client-id>"
  },
  "AzureCommunicationServices": {
    "ConnectionString": "<your-acs-connection-string>",
    "Endpoint": "https://<your-acs-resource>.communication.azure.com"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=<server>;Database=ChatAppDb;User Id=<user>;Password=<password>;"
  },
  "AllowedOrigins": [
    "https://your-frontend-domain.com"
  ],
  "ApplicationInsights": {
    "ConnectionString": "<your-app-insights-connection-string>"
  }
}
```

---

## 8. Local Development & Testing

### 8.1 Local Development Environment Setup

#### 8.1.1 Prerequisites Installation

**macOS Setup:**
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (v18+)
brew install node@18

# Install .NET 8 SDK
brew install --cask dotnet-sdk

# Install Azure CLI
brew install azure-cli

# Install Docker Desktop (for local SQL Server)
brew install --cask docker

# Install Visual Studio Code
brew install --cask visual-studio-code

# Install VS Code extensions (optional)
code --install-extension ms-dotnettools.csharp
code --install-extension ms-azuretools.vscode-azurefunctions
code --install-extension dbaeumer.vscode-eslint
```

#### 8.1.2 Azure Resources Setup

**Step 1: Create Azure Resources**

```bash
# Login to Azure
az login

# Set subscription (if you have multiple)
az account list --output table
az account set --subscription "<subscription-id>"

# Create resource group
az group create \
  --name rg-chatapp-dev \
  --location eastus

# Create Azure Communication Services
az communication create \
  --name acs-chatapp-dev-<your-initials> \
  --resource-group rg-chatapp-dev \
  --location global \
  --data-location UnitedStates

# Get ACS connection string (save this!)
az communication list-key \
  --name acs-chatapp-dev-<your-initials> \
  --resource-group rg-chatapp-dev \
  --query primaryConnectionString \
  --output tsv
```

**Step 2: Configure Microsoft Entra ID**

1. Go to **Azure Portal** (https://portal.azure.com)
2. Navigate to **Azure Active Directory**
3. Click **App registrations** > **New registration**

**App Registration Settings:**
- **Name**: `ChatApp-Local-Dev`
- **Supported account types**: Accounts in this organizational directory only
- **Redirect URI**: 
  - Type: Web
  - URL: `http://localhost:3000`

4. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**

5. **Create Client Secret**:
   - Go to **Certificates & secrets**
   - Click **New client secret**
   - Description: `Local Development`
   - Expires: 24 months
   - **IMPORTANT**: Copy the secret value immediately!

6. **Configure API Permissions**:
   - Go to **API permissions**
   - Click **Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Add: `User.Read`, `openid`, `profile`, `email`
   - Click **Grant admin consent** (if you have admin rights)

7. **Expose an API**:
   - Go to **Expose an API**
   - Click **Set** next to Application ID URI
   - Accept default: `api://<client-id>`
   - Click **Add a scope**:
     - Scope name: `access_as_user`
     - Who can consent: Admins and users
     - Admin consent display name: `Access as user`
     - Admin consent description: `Allow the application to access as user`
     - Click **Add scope**

8. **Add Redirect URIs**:
   - Go to **Authentication**
   - Add additional redirect URIs:
     - `http://localhost:3000/redirect`
     - `http://localhost:3000/auth/callback`
   - Under **Implicit grant and hybrid flows**, check:
     - ✅ Access tokens
     - ✅ ID tokens
   - Save

#### 8.1.3 Local Database Setup

**Option 1: Using Docker (Recommended)**

```bash
# Pull SQL Server image
docker pull mcr.microsoft.com/mssql/server:2022-latest

# Run SQL Server container
docker run -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong@Passw0rd123" \
  -p 1433:1433 \
  --name sql-chatapp-dev \
  --hostname sql-chatapp \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Verify container is running
docker ps

# Test connection
docker exec -it sql-chatapp-dev /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Passw0rd123" \
  -Q "SELECT @@VERSION"
```

**Option 2: Using PostgreSQL with Docker**

```bash
# Run PostgreSQL container
docker run --name postgres-chatapp-dev \
  -e POSTGRES_PASSWORD=YourStrong@Passw0rd123 \
  -e POSTGRES_DB=ChatAppDb \
  -p 5432:5432 \
  -d postgres:15-alpine

# Test connection
docker exec -it postgres-chatapp-dev psql -U postgres -d ChatAppDb
```

### 8.2 Backend Setup

#### 8.2.1 Clone and Configure Backend

```bash
# Navigate to project directory
cd /Users/gurkan_indibay/source/azure_communications

# Create solution and projects
dotnet new sln -n ChatApp

# Create projects
dotnet new webapi -n ChatApp.API -o ChatApp.API
dotnet new classlib -n ChatApp.Core -o ChatApp.Core
dotnet new classlib -n ChatApp.Infrastructure -o ChatApp.Infrastructure
dotnet new classlib -n ChatApp.Application -o ChatApp.Application
dotnet new xunit -n ChatApp.Tests -o ChatApp.Tests

# Add projects to solution
dotnet sln add ChatApp.API/ChatApp.API.csproj
dotnet sln add ChatApp.Core/ChatApp.Core.csproj
dotnet sln add ChatApp.Infrastructure/ChatApp.Infrastructure.csproj
dotnet sln add ChatApp.Application/ChatApp.Application.csproj
dotnet sln add ChatApp.Tests/ChatApp.Tests.csproj

# Add project references
cd ChatApp.API
dotnet add reference ../ChatApp.Application/ChatApp.Application.csproj
dotnet add reference ../ChatApp.Infrastructure/ChatApp.Infrastructure.csproj
dotnet add reference ../ChatApp.Core/ChatApp.Core.csproj

cd ../ChatApp.Application
dotnet add reference ../ChatApp.Core/ChatApp.Core.csproj

cd ../ChatApp.Infrastructure
dotnet add reference ../ChatApp.Core/ChatApp.Core.csproj

cd ../ChatApp.Tests
dotnet add reference ../ChatApp.API/ChatApp.API.csproj
dotnet add reference ../ChatApp.Application/ChatApp.Application.csproj

cd ..
```

#### 8.2.2 Install NuGet Packages

```bash
cd ChatApp.API

# Authentication & Authorization
dotnet add package Microsoft.Identity.Web
dotnet add package Microsoft.Identity.Web.MicrosoftGraph

# Entity Framework Core
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
# OR for PostgreSQL:
# dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.EntityFrameworkCore.Design

# Azure SDKs
dotnet add package Azure.Communication.Identity
dotnet add package Azure.Communication.Chat
dotnet add package Azure.Identity

# Logging & Monitoring
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Microsoft.ApplicationInsights.AspNetCore

# API Documentation
dotnet add package Swashbuckle.AspNetCore

# Utilities
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet add package FluentValidation.AspNetCore

cd ../ChatApp.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Azure.Communication.Identity
dotnet add package Azure.Communication.Chat
dotnet add package Microsoft.Graph

cd ..
```

#### 8.2.3 Configure appsettings.Development.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-tenant-id-from-step-8.1.2>",
    "ClientId": "<your-client-id-from-step-8.1.2>",
    "ClientSecret": "<your-client-secret-from-step-8.1.2>",
    "Audience": "api://<your-client-id>"
  },
  "AzureCommunicationServices": {
    "ConnectionString": "<your-acs-connection-string-from-step-8.1.2>",
    "Endpoint": "https://acs-chatapp-dev-<initials>.communication.azure.com"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=ChatAppDb;User Id=sa;Password=YourStrong@Passw0rd123;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:5173"
  ]
}
```

#### 8.2.4 Run Database Migrations

```bash
cd ChatApp.API

# Create initial migration
dotnet ef migrations add InitialCreate \
  --project ../ChatApp.Infrastructure/ChatApp.Infrastructure.csproj \
  --startup-project ChatApp.API.csproj \
  --context ApplicationDbContext

# Apply migration to database
dotnet ef database update \
  --project ../ChatApp.Infrastructure/ChatApp.Infrastructure.csproj \
  --startup-project ChatApp.API.csproj \
  --context ApplicationDbContext

# Verify database was created
# For SQL Server:
docker exec -it sql-chatapp-dev /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Passw0rd123" \
  -Q "SELECT name FROM sys.databases WHERE name = 'ChatAppDb'"
```

#### 8.2.5 Run Backend API

```bash
cd ChatApp.API

# Run in development mode
dotnet run

# Or run with watch (auto-reload on file changes)
dotnet watch run

# Backend should start on:
# - HTTPS: https://localhost:5001
# - HTTP: http://localhost:5000
# - Swagger UI: https://localhost:5001/swagger
```

**Verify Backend is Running:**
```bash
# Test health endpoint (if you created one)
curl -k https://localhost:5001/api/health

# Or open in browser:
open https://localhost:5001/swagger
```

### 8.3 Frontend Setup

#### 8.3.1 Create React Application

```bash
cd /Users/gurkan_indibay/source/azure_communications

# Create React app with TypeScript using Vite
npm create vite@latest chat-app-frontend -- --template react-ts

cd chat-app-frontend

# Install dependencies
npm install

# Install required packages
npm install @azure/msal-react @azure/msal-browser
npm install @azure/communication-chat @azure/communication-common
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install axios react-router-dom
npm install date-fns

# Install dev dependencies
npm install -D @types/node
```

#### 8.3.2 Configure Environment Variables

Create `.env.local` file:

```bash
# .env.local
VITE_API_BASE_URL=https://localhost:5001
VITE_ENTRA_CLIENT_ID=<your-client-id-from-step-8.1.2>
VITE_ENTRA_TENANT_ID=<your-tenant-id-from-step-8.1.2>
VITE_REDIRECT_URI=http://localhost:3000
```

Create `.env.production` file:

```bash
# .env.production
VITE_API_BASE_URL=https://your-api-domain.azurewebsites.net
VITE_ENTRA_CLIENT_ID=<production-client-id>
VITE_ENTRA_TENANT_ID=<your-tenant-id>
VITE_REDIRECT_URI=https://your-frontend-domain.com
```

#### 8.3.3 Update vite.config.ts

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    https: false, // Set to true if you need HTTPS locally
  },
  define: {
    'process.env': process.env
  }
});
```

#### 8.3.4 Run Frontend

```bash
cd chat-app-frontend

# Run development server
npm run dev

# Frontend should start on:
# http://localhost:3000
```

**Verify Frontend is Running:**
- Open browser to `http://localhost:3000`
- You should see the React app

### 8.4 Local Development Workflow

#### 8.4.1 Daily Development Workflow

```bash
# Terminal 1: Start database (if not already running)
docker start sql-chatapp-dev

# Terminal 2: Start backend API
cd /Users/gurkan_indibay/source/azure_communications/ChatApp.API
dotnet watch run

# Terminal 3: Start frontend
cd /Users/gurkan_indibay/source/azure_communications/chat-app-frontend
npm run dev

# Now you can develop:
# - Frontend: http://localhost:3000
# - Backend API: https://localhost:5001
# - Swagger UI: https://localhost:5001/swagger
```

#### 8.4.2 Testing the Complete Flow

**Test 1: Authentication**

1. Open browser to `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. You'll be redirected to Microsoft login
4. Sign in with your Microsoft account
5. After authentication, you should be redirected back
6. Check browser DevTools:
   - **Application** tab > **Session Storage** > Look for MSAL tokens
   - **Network** tab > **Headers** > Verify Authorization header in requests

**Test 2: Backend API Call**

```bash
# Get a token manually for testing
# 1. Sign in to the frontend
# 2. Open browser DevTools > Application > Session Storage
# 3. Find the access token
# 4. Use it to call the API:

curl -k -X GET "https://localhost:5001/api/auth/me" \
  -H "Authorization: Bearer <your-token-from-browser>"
```

**Test 3: Get ACS Token**

```bash
# After signing in, frontend should automatically get ACS token
# Check Network tab for:
# GET https://localhost:5001/api/auth/acs-token

# Response should include:
{
  "token": "ey...",
  "expiresOn": "2025-10-26T12:00:00Z",
  "acsUserId": "8:acs:..."
}
```

**Test 4: Two-User Chat Scenario**

1. **Browser 1 (Chrome)**: 
   - Sign in as User A
   - Search for User B
   - Start conversation

2. **Browser 2 (Firefox or Incognito)**:
   - Sign in as User B
   - Should see conversation with User A

3. **Send messages back and forth**:
   - Messages should appear in real-time in both browsers
   - Check typing indicators
   - Verify read receipts

### 8.5 Debugging

#### 8.5.1 Backend Debugging in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/ChatApp.API/bin/Debug/net8.0/ChatApp.API.dll",
      "args": [],
      "cwd": "${workspaceFolder}/ChatApp.API",
      "stopAtEntry": false,
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      },
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      },
      "sourceFileMap": {
        "/Views": "${workspaceFolder}/Views"
      }
    }
  ]
}
```

**Set Breakpoints:**
1. Open any controller file
2. Click left margin to set breakpoint
3. Press `F5` to start debugging
4. Make request from frontend
5. Debugger will pause at breakpoint

#### 8.5.2 Frontend Debugging

**Browser DevTools:**
1. Open Chrome DevTools (F12)
2. Go to **Sources** tab
3. Find your component file
4. Set breakpoints
5. Interact with UI
6. Debugger pauses at breakpoints

**VS Code Debugging for Frontend:**

Install "Debugger for Chrome" extension, then create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/chat-app-frontend/src"
    }
  ]
}
```

#### 8.5.3 Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **CORS Error** | Browser console shows "CORS policy" error | Add frontend URL to `AllowedOrigins` in appsettings.json |
| **401 Unauthorized** | API returns 401 | Check Entra ID token is valid, verify `AzureAd` config |
| **Database Connection Failed** | EF Core throws connection error | Verify Docker container is running: `docker ps` |
| **ACS Token Invalid** | Chat client init fails | Verify ACS connection string is correct |
| **MSAL Redirect Loop** | Keeps redirecting to login | Clear browser cache, verify redirect URIs in App Registration |
| **Port Already in Use** | "Address already in use" | Kill process: `lsof -ti:5001 \| xargs kill -9` |
| **EF Migrations Failed** | Migration command errors | Delete `Migrations` folder and recreate |

### 8.6 Testing Tools

#### 8.6.1 API Testing with Swagger

1. Start backend: `dotnet run`
2. Open Swagger UI: `https://localhost:5001/swagger`
3. Click **Authorize** button
4. Get a token from browser (sign in to frontend first)
5. Paste token in format: `Bearer <token>`
6. Test endpoints directly in Swagger

#### 8.6.2 API Testing with Postman

```bash
# Install Postman
brew install --cask postman
```

**Create Collection:**
1. Create new collection: "ChatApp API"
2. Add environment variables:
   - `baseUrl`: `https://localhost:5001`
   - `token`: `<get-from-browser>`
3. Add requests:
   - GET `{{baseUrl}}/api/auth/me`
   - GET `{{baseUrl}}/api/auth/acs-token`
   - GET `{{baseUrl}}/api/conversations`
4. Set Authorization header: `Bearer {{token}}`

#### 8.6.3 Database Inspection

**SQL Server:**
```bash
# Using Docker exec
docker exec -it sql-chatapp-dev /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Passw0rd123"

# Query users
SELECT * FROM ChatAppDb.dbo.Users;

# Query conversations
SELECT * FROM ChatAppDb.dbo.Conversations;
```

**Or use Azure Data Studio:**
```bash
brew install --cask azure-data-studio

# Connect to: localhost,1433
# Username: sa
# Password: YourStrong@Passw0rd123
```

---

## 9. Azure Resources Provisioning

This section provides detailed instructions for creating all required Azure resources for the Simple Chat Application.

### 9.1 Prerequisites

Before provisioning Azure resources, ensure you have:

- **Azure Subscription**: Active Azure subscription with Owner or Contributor role
- **Azure CLI**: Version 2.50.0 or later installed
- **PowerShell** (optional): For automation scripts
- **Permissions**: Ability to create resources and register applications in Microsoft Entra ID

### 9.2 Resource Overview

The following Azure resources are required:

| Resource | Purpose | SKU/Tier | Estimated Cost |
|----------|---------|----------|----------------|
| Azure Communication Services | Real-time chat functionality | Standard | Pay-per-use (~$0.01/chat user/day) |
| Microsoft Entra ID App Registration | Authentication & authorization | Free | Free |
| Azure App Service | Backend API hosting (production) | B1 Basic | ~$13/month |
| Azure SQL Database | Data persistence (production) | Basic | ~$5/month |
| Azure Static Web Apps | Frontend hosting (production) | Standard | $9/month |
| Application Insights | Monitoring & diagnostics | Pay-as-you-go | ~$2-5/month |
| Azure Key Vault | Secrets management | Standard | ~$0.50/month |

**Total Estimated Cost (Production)**: ~$30-35/month

### 9.3 Step-by-Step Provisioning Guide

#### Step 1: Login to Azure

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify current subscription
az account show --output table
```

#### Step 2: Create Resource Group

```bash
# Set variables (customize these)
RESOURCE_GROUP="rg-simplechat-prod"
LOCATION="eastus"
APP_NAME="simplechat"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Production Application=SimpleChat
```

#### Step 3: Create Azure Communication Services

```bash
# Create ACS resource
ACS_NAME="${APP_NAME}-acs-${LOCATION}"

az communication create \
  --name $ACS_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "Global" \
  --data-location "UnitedStates"

# Get connection string (save this securely)
ACS_CONNECTION_STRING=$(az communication list-key \
  --name $ACS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query primaryConnectionString \
  --output tsv)

echo "ACS Connection String: $ACS_CONNECTION_STRING"
```

#### Step 4: Register Microsoft Entra ID Application

```bash
# Create Entra ID app registration
APP_DISPLAY_NAME="${APP_NAME}-api"

# Create the application
APP_ID=$(az ad app create \
  --display-name $APP_DISPLAY_NAME \
  --sign-in-audience AzureADMyOrg \
  --query appId \
  --output tsv)

echo "Application (Client) ID: $APP_ID"

# Get tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)
echo "Tenant ID: $TENANT_ID"

# Create a client secret
CLIENT_SECRET=$(az ad app credential reset \
  --id $APP_ID \
  --append \
  --display-name "Production Secret" \
  --years 2 \
  --query password \
  --output tsv)

echo "Client Secret: $CLIENT_SECRET"
echo "⚠️  SAVE THIS SECRET - it won't be shown again!"

# Add API permissions (Microsoft Graph - User.Read)
az ad app permission add \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Grant admin consent (requires admin privileges)
az ad app permission grant \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --scope User.Read

# Add redirect URIs for production
az ad app update \
  --id $APP_ID \
  --web-redirect-uris \
    "https://${APP_NAME}.azurestaticapps.net/auth/callback" \
    "https://${APP_NAME}-api.azurewebsites.net/signin-oidc"

# Expose an API (create Application ID URI)
az ad app update \
  --id $APP_ID \
  --identifier-uris "api://${APP_ID}"

# Add a scope for the API
az ad app update \
  --id $APP_ID \
  --set api.oauth2PermissionScopes="[{
    \"adminConsentDescription\": \"Allow the application to access the Simple Chat API on behalf of the signed-in user.\",
    \"adminConsentDisplayName\": \"Access Simple Chat API\",
    \"id\": \"$(uuidgen)\",
    \"isEnabled\": true,
    \"type\": \"User\",
    \"userConsentDescription\": \"Allow the application to access the Simple Chat API on your behalf.\",
    \"userConsentDisplayName\": \"Access Simple Chat API\",
    \"value\": \"access_as_user\"
  }]"
```

#### Step 5: Create Azure SQL Database

```bash
# Set database variables
SQL_SERVER_NAME="${APP_NAME}-sql-${LOCATION}"
SQL_DB_NAME="${APP_NAME}-db"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd$(openssl rand -base64 12 | tr -d '=+/' | cut -c1-8)"

echo "SQL Admin Password: $SQL_ADMIN_PASSWORD"
echo "⚠️  SAVE THIS PASSWORD!"

# Create SQL Server
az sql server create \
  --name $SQL_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $SQL_ADMIN_USER \
  --admin-password $SQL_ADMIN_PASSWORD \
  --enable-public-network true

# Configure firewall to allow Azure services
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create SQL Database
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server $SQL_SERVER_NAME \
  --name $SQL_DB_NAME \
  --service-objective Basic \
  --backup-storage-redundancy Local \
  --zone-redundant false

# Get connection string
SQL_CONNECTION_STRING="Server=tcp:${SQL_SERVER_NAME}.database.windows.net,1433;Initial Catalog=${SQL_DB_NAME};Persist Security Info=False;User ID=${SQL_ADMIN_USER};Password=${SQL_ADMIN_PASSWORD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

echo "SQL Connection String: $SQL_CONNECTION_STRING"
```

#### Step 6: Create Azure App Service (Backend API)

```bash
# Create App Service Plan
APP_SERVICE_PLAN="${APP_NAME}-plan"

az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --is-linux

# Create Web App
BACKEND_APP_NAME="${APP_NAME}-api"

az webapp create \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "DOTNETCORE:8.0"

# Configure app settings
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AzureAd__Instance="https://login.microsoftonline.com/" \
    AzureAd__Domain="${TENANT_ID}" \
    AzureAd__TenantId="$TENANT_ID" \
    AzureAd__ClientId="$APP_ID" \
    AzureAd__ClientSecret="$CLIENT_SECRET" \
    AzureCommunicationServices__ConnectionString="$ACS_CONNECTION_STRING" \
    ConnectionStrings__DefaultConnection="$SQL_CONNECTION_STRING" \
    ASPNETCORE_ENVIRONMENT="Production"

# Enable HTTPS only
az webapp update \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# Configure CORS
az webapp cors add \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "https://${APP_NAME}.azurestaticapps.net"

# Enable managed identity
az webapp identity assign \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

#### Step 7: Create Azure Static Web App (Frontend)

```bash
# Create Static Web App
FRONTEND_APP_NAME="${APP_NAME}"

az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Get deployment token
STATIC_WEB_APP_TOKEN=$(az staticwebapp secrets list \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey \
  --output tsv)

echo "Static Web App Deployment Token: $STATIC_WEB_APP_TOKEN"
echo "⚠️  Add this to your GitHub repository secrets as AZURE_STATIC_WEB_APPS_API_TOKEN"

# Configure environment variables
az staticwebapp appsettings set \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    VITE_ENTRA_CLIENT_ID="$APP_ID" \
    VITE_ENTRA_TENANT_ID="$TENANT_ID" \
    VITE_API_BASE_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
```

#### Step 8: Create Application Insights

```bash
# Create Application Insights
APPINSIGHTS_NAME="${APP_NAME}-insights"

az monitor app-insights component create \
  --app $APPINSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web \
  --kind web

# Get instrumentation key
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Get connection string
APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv)

# Link to App Service
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION_STRING"

echo "Application Insights Connection String: $APPINSIGHTS_CONNECTION_STRING"
```

#### Step 9: Create Azure Key Vault (Optional but Recommended)

```bash
# Create Key Vault
KEYVAULT_NAME="${APP_NAME}kv${LOCATION}"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku standard \
  --enable-rbac-authorization false

# Store secrets in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "ACS-ConnectionString" \
  --value "$ACS_CONNECTION_STRING"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "EntraId-ClientSecret" \
  --value "$CLIENT_SECRET"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "SQL-ConnectionString" \
  --value "$SQL_CONNECTION_STRING"

# Grant App Service access to Key Vault
APP_IDENTITY=$(az webapp identity show \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --object-id $APP_IDENTITY \
  --secret-permissions get list

# Update App Service to use Key Vault references
az webapp config appsettings set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AzureCommunicationServices__ConnectionString="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/ACS-ConnectionString/)" \
    AzureAd__ClientSecret="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/EntraId-ClientSecret/)" \
    ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/SQL-ConnectionString/)"
```

### 9.4 Configuration Summary

After completing all steps, save these values securely:

```bash
# Create a configuration summary file
cat > azure-resources-config.txt <<EOF
================================
SIMPLE CHAT - AZURE RESOURCES
Created: $(date)
================================

RESOURCE GROUP:
  Name: $RESOURCE_GROUP
  Location: $LOCATION

AZURE COMMUNICATION SERVICES:
  Name: $ACS_NAME
  Connection String: $ACS_CONNECTION_STRING

MICROSOFT ENTRA ID:
  Application (Client) ID: $APP_ID
  Tenant ID: $TENANT_ID
  Client Secret: $CLIENT_SECRET

AZURE SQL:
  Server: ${SQL_SERVER_NAME}.database.windows.net
  Database: $SQL_DB_NAME
  Admin User: $SQL_ADMIN_USER
  Admin Password: $SQL_ADMIN_PASSWORD
  Connection String: $SQL_CONNECTION_STRING

APP SERVICE (Backend):
  Name: $BACKEND_APP_NAME
  URL: https://${BACKEND_APP_NAME}.azurewebsites.net

STATIC WEB APP (Frontend):
  Name: $FRONTEND_APP_NAME
  URL: https://${FRONTEND_APP_NAME}.azurestaticapps.net
  Deployment Token: $STATIC_WEB_APP_TOKEN

APPLICATION INSIGHTS:
  Name: $APPINSIGHTS_NAME
  Instrumentation Key: $APPINSIGHTS_KEY
  Connection String: $APPINSIGHTS_CONNECTION_STRING

KEY VAULT:
  Name: $KEYVAULT_NAME
  URL: https://${KEYVAULT_NAME}.vault.azure.net

================================
⚠️  IMPORTANT: Store this file securely!
   Do not commit to source control.
================================
EOF

echo "Configuration saved to: azure-resources-config.txt"
```

### 9.5 Automation Script

For convenience, here's a complete provisioning script:

```bash
#!/bin/bash
# provision-azure-resources.sh
# Complete Azure resource provisioning for Simple Chat Application

set -e  # Exit on error

# Configuration
RESOURCE_GROUP="rg-simplechat-prod"
LOCATION="eastus"
APP_NAME="simplechat"

echo "🚀 Starting Azure resource provisioning..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo ""

# Step 1: Login
echo "Step 1: Azure Login"
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Step 2: Resource Group
echo "Step 2: Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 3: ACS
echo "Step 3: Creating Azure Communication Services..."
ACS_NAME="${APP_NAME}-acs-${LOCATION}"
az communication create --name $ACS_NAME --resource-group $RESOURCE_GROUP --location "Global" --data-location "UnitedStates"
ACS_CONNECTION_STRING=$(az communication list-key --name $ACS_NAME --resource-group $RESOURCE_GROUP --query primaryConnectionString --output tsv)

# Step 4: Entra ID
echo "Step 4: Registering Entra ID Application..."
APP_ID=$(az ad app create --display-name "${APP_NAME}-api" --sign-in-audience AzureADMyOrg --query appId --output tsv)
TENANT_ID=$(az account show --query tenantId --output tsv)
CLIENT_SECRET=$(az ad app credential reset --id $APP_ID --append --years 2 --query password --output tsv)

# Step 5: SQL Database
echo "Step 5: Creating Azure SQL Database..."
SQL_SERVER_NAME="${APP_NAME}-sql-${LOCATION}"
SQL_ADMIN_PASSWORD="P@ssw0rd$(openssl rand -base64 12 | tr -d '=+/' | cut -c1-8)"
az sql server create --name $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --admin-user sqladmin --admin-password $SQL_ADMIN_PASSWORD
az sql db create --resource-group $RESOURCE_GROUP --server $SQL_SERVER_NAME --name "${APP_NAME}-db" --service-objective Basic

# Step 6: App Service
echo "Step 6: Creating App Service..."
az appservice plan create --name "${APP_NAME}-plan" --resource-group $RESOURCE_GROUP --location $LOCATION --sku B1 --is-linux
az webapp create --name "${APP_NAME}-api" --resource-group $RESOURCE_GROUP --plan "${APP_NAME}-plan" --runtime "DOTNETCORE:8.0"

# Step 7: Static Web App
echo "Step 7: Creating Static Web App..."
az staticwebapp create --name $APP_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard

# Step 8: Application Insights
echo "Step 8: Creating Application Insights..."
az monitor app-insights component create --app "${APP_NAME}-insights" --location $LOCATION --resource-group $RESOURCE_GROUP --application-type web

# Step 9: Key Vault
echo "Step 9: Creating Key Vault..."
az keyvault create --name "${APP_NAME}kv${LOCATION}" --resource-group $RESOURCE_GROUP --location $LOCATION

echo ""
echo "✅ All resources created successfully!"
echo "📝 Configuration details saved to azure-resources-config.txt"
```

### 9.6 Verification Checklist

After provisioning, verify all resources:

- [ ] **Resource Group exists**
  ```bash
  az group show --name $RESOURCE_GROUP
  ```

- [ ] **ACS resource is active**
  ```bash
  az communication show --name $ACS_NAME --resource-group $RESOURCE_GROUP
  ```

- [ ] **Entra ID app is registered**
  ```bash
  az ad app show --id $APP_ID
  ```

- [ ] **SQL Database is accessible**
  ```bash
  az sql db show --name $SQL_DB_NAME --server $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP
  ```

- [ ] **App Service is running**
  ```bash
  az webapp show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP
  curl https://${BACKEND_APP_NAME}.azurewebsites.net/health
  ```

- [ ] **Static Web App is deployed**
  ```bash
  az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP
  ```

- [ ] **Application Insights is collecting data**
  ```bash
  az monitor app-insights component show --app $APPINSIGHTS_NAME --resource-group $RESOURCE_GROUP
  ```

- [ ] **Key Vault secrets are stored**
  ```bash
  az keyvault secret list --vault-name $KEYVAULT_NAME
  ```

### 9.7 Cleanup (Development/Testing)

To delete all resources and avoid charges:

```bash
# Delete entire resource group (⚠️ IRREVERSIBLE!)
az group delete --name $RESOURCE_GROUP --yes --no-wait

# Delete Entra ID app registration
az ad app delete --id $APP_ID
```

### 9.8 Cost Optimization Tips

1. **Development Environment**: Use lower-tier SKUs
   - App Service: F1 (Free) or B1 (Basic)
   - SQL Database: Basic or Serverless
   - Static Web App: Free tier

2. **Auto-shutdown**: Configure App Service to stop during non-business hours

3. **Monitoring**: Set up budget alerts
   ```bash
   az consumption budget create \
     --budget-name "simplechat-budget" \
     --amount 50 \
     --category Cost \
     --time-grain Monthly \
     --resource-group $RESOURCE_GROUP
   ```

4. **Resource Tags**: Tag resources for cost tracking
   ```bash
   az resource tag \
     --tags Environment=Production CostCenter=Engineering \
     --ids $(az resource list --resource-group $RESOURCE_GROUP --query "[].id" --output tsv)
   ```

---

## 10. Security Design

### 10.1 Authentication Flow

```
┌──────────┐                                          ┌──────────────┐
│          │  1. User clicks "Sign in"                │              │
│  React   │─────────────────────────────────────────>│  MSAL.js     │
│  App     │                                          │              │
│          │                                          └──────┬───────┘
└──────────┘                                                 │
                                                             │ 2. Redirect to
                                                             │    Entra ID
                                                             ▼
                                                   ┌────────────────────┐
                                                   │  Microsoft         │
                                                   │  Entra ID          │
                                                   │  (Login Page)      │
                                                   └─────────┬──────────┘
                                                             │
                                                             │ 3. User enters
                                                             │    credentials
                                                             ▼
                                                   ┌────────────────────┐
                                                   │  MFA (if enabled)  │
                                                   └─────────┬──────────┘
                                                             │
                    4. Redirect with auth code              │
┌──────────┐       <─────────────────────────────────────────┘
│          │
│  React   │  5. Exchange code for tokens
│  App     │─────────────────────────────────────────>┌────────────────┐
│          │                                          │  Entra ID      │
│          │<─────────────────────────────────────────│  Token Service │
└────┬─────┘  6. Return: ID Token, Access Token      └────────────────┘
     │
     │ 7. Store tokens (sessionStorage)
     │ 8. Get ACS token from backend
     ▼
┌──────────────────────────────────────────────────────────┐
│  API Call: GET /api/auth/acs-token                       │
│  Headers: Authorization: Bearer <entra-access-token>     │
└───────────────────────────┬──────────────────────────────┘
                            │
                            ▼
                   ┌───────────────────┐
                   │  Backend API      │
                   │  - Validate token │
                   │  - Get ACS token  │
                   └────────┬──────────┘
                            │
                            ▼
                   ┌───────────────────┐
                   │  Return ACS Token │
                   └───────────────────┘
```

### 9.2 API Security

**Token Validation:**
```csharp
// Configured in Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        builder.Configuration.Bind("AzureAd", options);
        options.TokenValidationParameters.ValidAudiences = new[]
        {
            $"api://{builder.Configuration["AzureAd:ClientId"]}"
        };
    }, options =>
    {
        builder.Configuration.Bind("AzureAd", options);
    });
```

**Authorization Policies:**
```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAuthenticatedUser", policy =>
        policy.RequireAuthenticatedUser());
});

// Apply to controllers
[Authorize(Policy = "RequireAuthenticatedUser")]
public class ChatController : ControllerBase
{
    // ...
}
```

### 9.3 Data Protection

- **In Transit**: All communications use HTTPS/TLS 1.3
- **At Rest**: Azure SQL Database encryption enabled by default
- **Secrets Management**: Use Azure Key Vault in production
- **Connection Strings**: Never commit to source control

---

## 10. Deployment Architecture

### 10.1 Production Architecture

```
                        ┌─────────────────────┐
                        │   Azure Front Door  │
                        │   (CDN + WAF)       │
                        └──────────┬──────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
                ▼                                     ▼
    ┌────────────────────────┐          ┌────────────────────────┐
    │  Azure Static Web Apps │          │  Azure App Service     │
    │  (React Frontend)      │          │  (.NET API)            │
    │  - Auto-scaling        │          │  - Auto-scaling        │
    │  - Global CDN          │          │  - Health monitoring   │
    └────────────────────────┘          └────────┬───────────────┘
                                                  │
                        ┌─────────────────────────┴─────────────┐
                        │                                       │
                        ▼                                       ▼
              ┌──────────────────┐                 ┌──────────────────┐
              │  Azure SQL DB    │                 │  External        │
              │  - Geo-redundant │                 │  Services        │
              │  - Auto-backup   │                 │  - Entra ID      │
              └──────────────────┘                 │  - ACS           │
                                                   │  - App Insights  │
                                                   └──────────────────┘
```

---

## 11. API Design

### 11.1 RESTful API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/initialize` | Initialize user on first login | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/auth/acs-token` | Get ACS token | ✅ |
| GET | `/api/users/search?q={query}` | Search users | ✅ |
| GET | `/api/users/{userId}` | Get user by ID | ✅ |
| PUT | `/api/users/me` | Update profile | ✅ |
| POST | `/api/users/me/avatar` | Upload avatar | ✅ |
| GET | `/api/users/{userId}/presence` | Get user presence | ✅ |
| GET | `/api/conversations` | Get user's conversations | ✅ |
| POST | `/api/conversations` | Create new conversation | ✅ |
| GET | `/api/conversations/{id}` | Get conversation details | ✅ |
| GET | `/api/conversations/{id}/messages` | Get messages | ✅ |
| POST | `/api/conversations/{id}/messages` | Send message | ✅ |
| POST | `/api/conversations/{id}/read` | Mark as read | ✅ |

### 11.2 API Response Format

```json
// Success Response
{
  "data": { ... },
  "success": true,
  "message": null,
  "timestamp": "2025-10-26T10:00:00Z"
}

// Error Response
{
  "data": null,
  "success": false,
  "message": "Error message",
  "errors": ["Validation error 1", "Validation error 2"],
  "timestamp": "2025-10-26T10:00:00Z"
}
```

---

## 12. Data Flow Diagrams

### 12.1 Send Message Flow

```
User A (Browser)                    Backend API                     Azure ACS                    User B (Browser)
     │                                   │                              │                              │
     │ 1. Type message                   │                              │                              │
     │ 2. Click Send                     │                              │                              │
     │────────────────────────────────>│                              │                              │
     │ POST /api/conversations/         │                              │                              │
     │      {id}/messages               │                              │                              │
     │                                   │ 3. Validate token            │                              │
     │                                   │ 4. Save to database          │                              │
     │                                   │──────────────────────────>│                              │
     │                                   │ 5. Send via ACS Chat SDK     │                              │
     │                                   │                              │                              │
     │                                   │                              │ 6. Real-time delivery        │
     │                                   │                              │─────────────────────────────>│
     │                                   │                              │                              │ 7. Message appears
     │<────────────────────────────────│                              │                              │
     │ 8. Return message DTO            │                              │                              │
     │                                   │                              │                              │
```

### 12.2 Read Receipt Flow

```
User B (Browser)                    Backend API                     Database
     │                                   │                              │
     │ 1. View message                   │                              │
     │ 2. Trigger read receipt           │                              │
     │────────────────────────────────>│                              │
     │ POST /api/conversations/         │                              │
     │      {id}/read                   │                              │
     │                                   │ 3. Validate token            │
     │                                   │──────────────────────────>│
     │                                   │ 4. Insert MessageReceipt     │
     │                                   │                              │
     │<────────────────────────────────│                              │
     │ 5. 204 No Content                │                              │
```

---

## 13. Error Handling & Logging

### 13.1 Error Handling Strategy

```csharp
// Middleware/ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            await HandleExceptionAsync(context, ex, HttpStatusCode.NotFound);
        }
        catch (UnauthorizedException ex)
        {
            await HandleExceptionAsync(context, ex, HttpStatusCode.Unauthorized);
        }
        catch (ValidationException ex)
        {
            await HandleExceptionAsync(context, ex, HttpStatusCode.BadRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex, HttpStatusCode.InternalServerError);
        }
    }

    private static Task HandleExceptionAsync(
        HttpContext context,
        Exception exception,
        HttpStatusCode statusCode)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            message = exception.Message,
            timestamp = DateTime.UtcNow
        };

        return context.Response.WriteAsJsonAsync(response);
    }
}
```

### 13.2 Logging Configuration

```csharp
// Program.cs
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("ApplicationName", "ChatApp")
        .WriteTo.Console()
        .WriteTo.ApplicationInsights(
            context.Configuration["ApplicationInsights:ConnectionString"],
            TelemetryConverter.Traces);
});
```

---

## 14. Performance Considerations

### 14.1 Database Optimization

- **Indexes**: Created on frequently queried columns (EntraIdObjectId, Email, ConversationId, etc.)
- **Pagination**: All list endpoints use pagination (default 50 items)
- **Connection Pooling**: Enabled by default in EF Core
- **Async Operations**: All database calls are asynchronous

### 14.2 Caching Strategy

```csharp
// Future enhancement: Add distributed caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
});
```

### 14.3 Frontend Optimization

- **Code Splitting**: React lazy loading for routes
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Virtual Scrolling**: Implement for large message lists
- **Image Optimization**: Compress avatars before upload

---

## 15. Appendix

### 15.1 Glossary

- **ACS**: Azure Communication Services
- **Entra ID**: Microsoft Entra ID (formerly Azure Active Directory)
- **MSAL**: Microsoft Authentication Library
- **SPA**: Single Page Application
- **EF Core**: Entity Framework Core
- **DTO**: Data Transfer Object
- **JWT**: JSON Web Token

### 15.2 References

- [Azure Communication Services Documentation](https://learn.microsoft.com/azure/communication-services/)
- [Microsoft Entra ID Documentation](https://learn.microsoft.com/entra/identity/)
- [MSAL.js Documentation](https://learn.microsoft.com/azure/active-directory/develop/msal-overview)
- [ASP.NET Core Documentation](https://learn.microsoft.com/aspnet/core/)
- [React Documentation](https://react.dev/)

### 15.3 Development Team Contacts

| Role | Responsibility | Contact |
|------|----------------|---------|
| Backend Lead | .NET API, Database | TBD |
| Frontend Lead | React Application | TBD |
| DevOps Engineer | CI/CD, Azure Resources | TBD |
| QA Lead | Testing Strategy | TBD |

---

**Document Version**: 1.0  
**Last Updated**: October 26, 2025  
**Author**: Development Team  
**Status**: Final


