# SimpleChat - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Azure Services](#azure-services)
5. [Component Architecture](#component-architecture)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Real-time Messaging](#real-time-messaging)
10. [Database Schema](#database-schema)
11. [API Design](#api-design)
12. [Performance Considerations](#performance-considerations)
13. [Monitoring and Logging](#monitoring-and-logging)
14. [Scalability](#scalability)

---

## 1. System Overview

### 1.1 Purpose

SimpleChat is a real-time 1-on-1 chat application that demonstrates enterprise-grade architecture using Microsoft Azure services. The application enables authenticated users to have real-time text conversations with message persistence, read receipts, and typing indicators.

### 1.2 Key Features

- **Real-time Messaging**: Sub-100ms message delivery using Azure Communication Services
- **Enterprise Authentication**: Microsoft Entra ID (Azure AD) integration
- **Message Persistence**: SQL Server database for message history
- **Secure Communication**: HTTPS everywhere, JWT token-based authorization
- **Scalable Infrastructure**: Containerized deployment on Azure
- **Global Distribution**: Azure Front Door for CDN and routing

### 1.3 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Front Door                         │
│                    (CDN + Load Balancer)                         │
└───────────────────┬─────────────────────┬───────────────────────┘
                    │                     │
                    ▼                     ▼
         ┌──────────────────┐   ┌──────────────────┐
         │  Frontend (SPA)  │   │  Backend (API)   │
         │  React + Vite    │   │  ASP.NET Core    │
         │  Nginx Container │   │  Docker Container│
         └────────┬─────────┘   └────────┬─────────┘
                  │                      │
                  │                      ├──────────┐
                  │                      │          │
                  ▼                      ▼          ▼
         ┌─────────────────┐   ┌──────────────┐  ┌──────────────┐
         │ Azure Comm.     │   │ Azure SQL DB │  │ Azure Key    │
         │ Services (ACS)  │   │              │  │ Vault        │
         │                 │   │              │  │              │
         └─────────────────┘   └──────────────┘  └──────────────┘
                  ▲
                  │
         ┌────────┴─────────┐
         │                  │
         ▼                  ▼
    ┌─────────┐      ┌─────────┐
    │ User A  │      │ User B  │
    │ Browser │      │ Browser │
    └─────────┘      └─────────┘
```

### 1.4 Design Principles

1. **Separation of Concerns**: Frontend, backend, and data layers are clearly separated
2. **Direct Real-time Communication**: ACS handles real-time messaging, bypassing backend for low latency
3. **Cloud-Native**: Fully leverages Azure PaaS services
4. **Security-First**: Authentication and authorization at every layer
5. **Observability**: Comprehensive logging and monitoring
6. **Scalability**: Stateless design enables horizontal scaling

---

## 2. Technology Stack

### 2.1 Frontend Technologies

#### Core Framework
- **React 19.1.1**: Modern UI library with hooks and concurrent rendering
- **TypeScript 5.9.3**: Type-safe JavaScript for better developer experience
- **Vite 7.1.7**: Next-generation build tool for fast development

#### UI Framework
- **Material-UI (MUI) 7.3.4**: Comprehensive React component library
  - `@mui/material`: Core components
  - `@mui/icons-material`: Icon library
  - `@emotion/react` & `@emotion/styled`: CSS-in-JS styling

#### Authentication
- **@azure/msal-browser 4.25.1**: Microsoft Authentication Library for browser
- **@azure/msal-react 3.0.20**: React wrapper for MSAL

#### Real-time Communication
- **@azure/communication-chat 1.6.0**: Azure Communication Services Chat SDK
- **@azure/communication-common 2.4.0**: Common types and utilities for ACS

#### HTTP Client & Routing
- **axios 1.12.2**: Promise-based HTTP client
- **react-router-dom 7.9.4**: Declarative routing for React

#### Utilities
- **date-fns 4.1.0**: Modern date utility library

### 2.2 Backend Technologies

#### Core Framework
- **ASP.NET Core 8.0**: Cross-platform, high-performance web framework
- **C# 12**: Modern, type-safe programming language

#### Architecture Layers
- **SimpleChat.API**: Web API controllers and startup configuration
- **SimpleChat.Application**: Business logic, DTOs, and service interfaces
- **SimpleChat.Core**: Domain entities and core interfaces
- **SimpleChat.Infrastructure**: Data access, external services, repositories

#### Database
- **Entity Framework Core 8.0**: Modern ORM for .NET
- **Microsoft.Data.SqlClient**: SQL Server data provider
- **SQL Server**: Relational database (Azure SQL or local)

#### Azure SDKs
- **Azure.Communication.Identity**: ACS identity and token management
- **Azure.Communication.Chat**: ACS chat service integration
- **Azure.Identity**: Azure authentication and managed identities
- **Azure.Security.KeyVault.Secrets**: Secure configuration management

#### Authentication & Authorization
- **Microsoft.Identity.Web 3.2.1**: Microsoft Entra ID integration
- **Microsoft.AspNetCore.Authentication.JwtBearer**: JWT token validation

#### Logging & Monitoring
- **Serilog**: Structured logging framework
  - `Serilog.AspNetCore`: ASP.NET Core integration
  - `Serilog.Sinks.Console`: Console output
  - `Serilog.Sinks.File`: File-based logging

#### Utilities
- **AutoMapper**: Object-to-object mapping
- **Swashbuckle.AspNetCore**: OpenAPI/Swagger documentation

### 2.3 Infrastructure Technologies

#### Containerization
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration (local development)

#### Azure Services
- **Azure Container Registry (ACR)**: Private container image registry
- **Azure Container Instances (ACI)**: Serverless container hosting
- **Azure Front Door**: Global CDN and application delivery network
- **Azure SQL Database**: Managed relational database (Serverless tier)
- **Azure Key Vault**: Secrets and configuration management
- **Azure Communication Services**: Real-time communication platform
- **Microsoft Entra ID**: Identity and access management

#### Web Server
- **Nginx (Alpine)**: Lightweight reverse proxy for frontend static files
- **Kestrel**: ASP.NET Core web server for backend API

### 2.4 Development Tools

#### Version Control
- **Git**: Distributed version control system
- **GitHub**: Code hosting and collaboration

#### Package Managers
- **npm**: Node.js package manager (frontend)
- **NuGet**: .NET package manager (backend)

#### CLI Tools
- **Azure CLI**: Azure resource management
- **dotnet CLI**: .NET development tools
- **Docker CLI**: Container management

#### Development Scripts
- **dev.sh**: Unified development environment manager
- **run_sql.py**: Database query utility
- **deploy-to-azure.sh**: Automated deployment script

### 2.5 Database Technology

#### Database Engine
- **SQL Server 2022**: Enterprise-grade relational database
- **Azure SQL Database**: Managed SQL Server in the cloud
  - Tier: General Purpose (Serverless)
  - Compute: 0.5-1 vCore with auto-pause
  - Storage: Locally redundant backup

#### Schema Management
- **Entity Framework Core Migrations**: Version-controlled schema changes
- **SQL Scripts**: Database initialization and seeding

---

## 3. Architecture Patterns

### 3.1 Backend Architecture Patterns

#### Clean Architecture (Onion Architecture)

The backend follows Clean Architecture principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   SimpleChat.API                        │
│  (Controllers, Middleware, Configuration)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              SimpleChat.Application                     │
│  (Services, DTOs, Business Logic, Interfaces)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                SimpleChat.Core                          │
│  (Domain Entities, Core Interfaces)                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           SimpleChat.Infrastructure                     │
│  (EF Core, Repositories, External Services)             │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Dependency flows inward (dependencies point toward core)
- Business logic isolated from infrastructure concerns
- Easy to test with dependency injection
- Framework-agnostic domain layer

#### Repository Pattern

Data access is abstracted through repositories:

```csharp
// Interface (in Core)
public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByAzureCommunicationUserIdAsync(string acsUserId);
    Task AddAsync(User user);
}

// Implementation (in Infrastructure)
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;
    // Implementation details...
}
```

**Benefits:**
- Decouples business logic from data access
- Enables unit testing with mock repositories
- Centralizes data access logic

#### Unit of Work Pattern

Coordinates multiple repository operations within a single transaction:

```csharp
public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IChatThreadRepository ChatThreads { get; }
    IMessageRepository Messages { get; }
    Task<int> SaveChangesAsync();
}
```

**Benefits:**
- Ensures transactional consistency
- Single point for database commits
- Reduces database round-trips

#### Service Layer Pattern

Business logic is encapsulated in service classes:

```csharp
public interface IChatService
{
    Task<ChatThreadDto> CreateThreadAsync(string userId1, string userId2);
    Task<MessageDto> SendMessageAsync(string threadId, string senderId, string content);
}
```

**Benefits:**
- Separates business logic from controllers
- Reusable across different entry points (API, background jobs)
- Clear contract through interfaces

#### Dependency Injection

All dependencies are injected through constructor injection:

```csharp
public class ChatService : IChatService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAzureCommunicationService _acsService;
    private readonly ILogger<ChatService> _logger;
    
    public ChatService(
        IUnitOfWork unitOfWork,
        IAzureCommunicationService acsService,
        ILogger<ChatService> logger)
    {
        _unitOfWork = unitOfWork;
        _acsService = acsService;
        _logger = logger;
    }
}
```

**Benefits:**
- Loose coupling between components
- Easy to mock for testing
- Centralized configuration

### 3.2 Frontend Architecture Patterns

#### Component-Based Architecture

React components organized by feature and responsibility:

```
src/
├── components/           # Reusable UI components
│   ├── ChatWindow.tsx
│   ├── ChatHeader.tsx
│   ├── UserList.tsx
│   └── MessageBubble.tsx
├── pages/               # Page-level components
│   ├── ChatPage.tsx
│   └── LoginPage.tsx
├── contexts/            # React Context providers
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
│   └── useAcsChat.ts
├── services/            # API and external service clients
│   ├── api.ts
│   └── acsChatService.ts
└── types/              # TypeScript type definitions
    └── index.ts
```

#### Custom Hooks Pattern

Complex logic is encapsulated in custom hooks:

```typescript
export const useAcsChat = ({
  threadId,
  onMessageReceived,
  // ... other callbacks
}: UseAcsChatOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  
  const initializeChat = useCallback(async (token, endpoint) => {
    await acsChatService.initialize(token, endpoint, eventHandlers);
    setIsConnected(true);
  }, []);
  
  return {
    isConnected,
    initializeChat,
    sendMessage,
    // ... other methods
  };
};
```

**Benefits:**
- Reusable stateful logic
- Separation of concerns
- Easier testing

#### Context API for Global State

React Context provides global state for authentication:

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [acsToken, setAcsToken] = useState<string | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, acsToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Benefits:**
- Avoids prop drilling
- Single source of truth
- Reactive updates across components

#### Service Layer Pattern

External API calls abstracted through service classes:

```typescript
class ApiService {
  async getOrCreateThread(userId1: string, userId2: string): Promise<ChatThread> {
    const response = await axios.post(`${API_URL}/chats/threads`, {
      user1Id: userId1,
      user2Id: userId2
    });
    return response.data;
  }
}

export const apiService = new ApiService();
```

**Benefits:**
- Centralized API logic
- Easy to mock for testing
- Consistent error handling

#### Optimistic UI Updates

UI updates immediately before server confirmation:

```typescript
const handleSendMessage = async (content: string) => {
  // Optimistically add message to UI
  const optimisticMessage = {
    id: tempId,
    content,
    sentAt: new Date().toISOString(),
  };
  setMessages(prev => [...prev, optimisticMessage]);
  
  // Send to ACS (actual delivery)
  const messageId = await acsSendMessage(content);
};
```

**Benefits:**
- Perceived performance improvement
- Better user experience
- Graceful error handling

### 3.3 Integration Patterns

#### Direct Client-to-ACS Pattern

Frontend communicates directly with Azure Communication Services for real-time messaging:

```
┌──────────┐
│ Frontend │──────────────┐
└──────────┘              │
      │                   ▼
      │            ┌─────────────┐
      │            │     ACS     │
      │            │  (Real-time)│
      │            └─────────────┘
      │                   │
      ▼                   │
┌──────────┐              │
│ Backend  │◄─────────────┘
│   API    │   (Webhooks)
└──────────┘
```

**Flow:**
1. Frontend sends messages directly to ACS (low latency ~50ms)
2. ACS delivers messages to all participants in real-time
3. ACS sends webhooks to backend for message persistence
4. Backend stores messages in database for history

**Benefits:**
- Ultra-low latency for real-time messaging
- Backend doesn't bottleneck message delivery
- ACS handles connection management and presence

#### Backend as Metadata API

Backend serves as control plane, not data plane:

```
Frontend → Backend API:
  - Create chat threads
  - Get thread metadata
  - Fetch message history
  - User management
  - Generate ACS tokens

Frontend → ACS Direct:
  - Send messages
  - Receive messages
  - Typing indicators
  - Read receipts
```

**Benefits:**
- Clear separation of concerns
- Backend focuses on business logic and persistence
- ACS optimized for real-time delivery

### 3.4 Security Patterns

#### Token-Based Authentication Flow

```
1. User → Frontend: Login request
2. Frontend → Azure AD: Authenticate
3. Azure AD → Frontend: JWT access token
4. Frontend → Backend: API request + JWT
5. Backend: Validate JWT
6. Backend → Frontend: ACS user token
7. Frontend → ACS: Connect with ACS token
```

#### Managed Identity for Azure Services

Backend uses managed identity to access Azure resources:

```
Backend Container → Managed Identity → Key Vault → Secrets
                                     → ACS → Communication APIs
```

**Benefits:**
- No credentials in code or configuration
- Automatic credential rotation
- Azure RBAC for access control

---

## 4. Azure Services

### 4.1 Azure Communication Services (ACS)

#### Overview
Azure Communication Services provides cloud-based communication capabilities including chat, voice, video, SMS, and telephony.

#### Role in SimpleChat
- **Real-time chat messaging**: Primary messaging infrastructure
- **User identity management**: ACS user identity creation and token generation
- **Presence and typing indicators**: Real-time user status
- **Message delivery**: Guaranteed message ordering and delivery

#### Configuration
```json
{
  "AzureCommunicationServices": {
    "ConnectionString": "endpoint=https://simplechat-communication.unitedstates.communication.azure.com/;accesskey=..."
  }
}
```

#### Key Operations

**Create ACS User Identity**
```csharp
var identityClient = new CommunicationIdentityClient(connectionString);
var identityResponse = await identityClient.CreateUserAsync();
var acsUserId = identityResponse.Value.Id; // e.g., "8:acs:81380eb7-..."
```

**Generate Access Token**
```csharp
var tokenResponse = await identityClient.GetTokenAsync(
    identityResponse.Value,
    scopes: new[] { CommunicationTokenScope.Chat }
);
var token = tokenResponse.Value.Token;
var expiresOn = tokenResponse.Value.ExpiresOn;
```

**Create Chat Thread**
```csharp
var chatClient = new ChatClient(endpoint, new CommunicationTokenCredential(token));
var thread = await chatClient.CreateChatThreadAsync(
    topic: "1-on-1 Chat",
    participants: new[] { participant1, participant2 }
);
```

#### Pricing Model
- **Pay-per-use**: Charged per message sent
- **Token generation**: Free
- **User identity creation**: Free
- **Estimated cost**: ~$0.0004 per chat message

### 4.2 Azure Front Door

#### Overview
Azure Front Door is a global, scalable entry point that uses Microsoft's global edge network to create fast, secure, and widely scalable web applications.

#### Role in SimpleChat
- **Global CDN**: Caches static frontend assets
- **SSL/TLS termination**: HTTPS endpoint with managed certificates
- **Load balancing**: Distributes traffic to backend origins
- **Routing**: Intelligent traffic routing based on URL patterns
- **WAF (Web Application Firewall)**: DDoS protection and security

#### Configuration

**Profile**: `simplechat-afd` (Standard tier)
**Endpoint**: `simplechat-endpoint-gcabh2fghfh6f0g4.z01.azurefd.net`

**Origin Groups**:
1. **simplechat-origin-group** (Frontend)
   - Origin: Frontend Container Instance
   - Health probe: HTTP /health
   - Route: `/*` (all traffic except API)

2. **simplechat-backend-origin-group** (Backend API)
   - Origin: Backend Container Instance  
   - Health probe: HTTP /health on port 8080
   - Route: `/api/*` (API traffic only)

**Routing Rules**:
```
Route 1: /api/*      → Backend Origin Group (HTTP only to origin)
Route 2: /*          → Frontend Origin Group (HTTP only to origin)
```

#### Benefits
- **Global performance**: Edge locations worldwide
- **Automatic failover**: Health probe-based routing
- **HTTPS everywhere**: Free SSL certificate for *.azurefd.net
- **Cache optimization**: Reduces origin load
- **DDoS protection**: Built-in Layer 7 protection

### 4.3 Azure Container Instances (ACI)

#### Overview
Azure Container Instances provides serverless container hosting without orchestration overhead.

#### Role in SimpleChat

**Backend Container**:
- **Name**: `simplechat-backend`
- **Image**: `collectionregistry.azurecr.io/simplechat-backend:latest`
- **Resources**: 1 CPU core, 1.5 GB memory
- **Ports**: 8080 (HTTP only)
- **Environment**: Production
- **Managed Identity**: Enabled for Key Vault access

**Frontend Container**:
- **Name**: `simplechat-frontend`
- **Image**: `collectionregistry.azurecr.io/simplechat-frontend:latest`
- **Resources**: 0.5 CPU core, 1 GB memory
- **Ports**: 80 (HTTP)
- **Web Server**: Nginx Alpine

#### Container Configuration

**Backend**:
```yaml
Environment Variables:
  ASPNETCORE_ENVIRONMENT: Production
  ASPNETCORE_URLS: http://+:8080
  KeyVault__VaultUri: https://kv-simplechat-demo-2025.vault.azure.net/

Secure Environment Variables:
  ConnectionStrings__DefaultConnection: <SQL connection string>
  AzureAd__TenantId: <tenant-id>
  AzureAd__ClientId: <client-id>
```

**Frontend**:
```yaml
Build Arguments:
  VITE_API_BASE_URL: /api
  VITE_AZURE_AD_CLIENT_ID: <client-id>
  VITE_AZURE_AD_TENANT_ID: <tenant-id>
  VITE_AZURE_AD_REDIRECT_URI: https://simplechat-endpoint-*.z01.azurefd.net
```

#### Benefits
- **Serverless**: No VM management
- **Fast startup**: Containers start in seconds
- **Cost-effective**: Pay only for running time
- **Auto-restart**: Automatic container restart on failure
- **Managed identity**: No credential management

### 4.4 Azure SQL Database

#### Overview
Fully managed SQL Server database with built-in high availability, backups, and scaling.

#### Role in SimpleChat
- **Message persistence**: Stores all chat messages
- **User metadata**: User profiles and ACS identity mapping
- **Thread management**: Chat thread metadata and participants

#### Configuration

**Tier**: General Purpose - Serverless
- **Compute**: 0.5-1 vCore (auto-scaling)
- **Storage**: Locally redundant backup
- **Auto-pause**: 60 minutes of inactivity
- **Min capacity**: 0.5 vCore
- **Backup retention**: 7 days

**Connection String**:
```
Server=tcp:simplechat-sql-server.database.windows.net,1433;
Initial Catalog=SimpleChatDB;
User ID=sqladmin;
Password=<password>;
MultipleActiveResultSets=True;
Encrypt=True;
TrustServerCertificate=False;
```

#### Cost Optimization

**Serverless Benefits**:
- Auto-pauses after 1 hour of inactivity (no compute charges)
- Auto-resumes on first query
- Scales compute based on workload
- **Estimated cost**: $0.50-2/month (vs. $5/month for Basic tier)

#### Firewall Rules
```
1. AllowAzureServices (0.0.0.0 - 0.0.0.0)
2. DeploymentIP-<timestamp> (Developer IP)
```

### 4.5 Azure Key Vault

#### Overview
Cloud service for securely storing and accessing secrets, keys, and certificates.

#### Role in SimpleChat
- **Secrets management**: ACS connection string storage
- **Configuration**: Centralized secure configuration
- **Access control**: RBAC for secret access

#### Configuration

**Name**: `kv-simplechat-demo-2025`
**SKU**: Standard

**Stored Secrets**:
```
AzureCommunicationServices--ConnectionString
  Value: endpoint=https://simplechat-communication.unitedstates.communication.azure.com/;accesskey=...
```

#### Access Pattern

**Backend Application**:
```csharp
// Using Managed Identity
var keyVaultUri = configuration["KeyVault:VaultUri"];
var secretClient = new SecretClient(
    new Uri(keyVaultUri),
    new DefaultAzureCredential()
);

var secret = await secretClient.GetSecretAsync("AzureCommunicationServices--ConnectionString");
var connectionString = secret.Value.Value;
```

#### RBAC Configuration
```
Principal: simplechat-backend-identity (Managed Identity)
Role: Key Vault Secrets User
Scope: kv-simplechat-demo-2025
```

#### Benefits
- **No secrets in code**: All sensitive data in vault
- **Automatic rotation**: Supports secret versioning
- **Audit logging**: All access logged
- **Managed identity**: No credentials needed

### 4.6 Azure Container Registry (ACR)

#### Overview
Private Docker registry for storing and managing container images.

#### Role in SimpleChat
- **Image storage**: Backend and frontend Docker images
- **CI/CD integration**: Automated builds and deployments
- **Version control**: Image tagging and versioning

#### Configuration

**Name**: `collectionregistry`
**SKU**: Basic
**Resource Group**: `collection-test-rg` (shared)

**Repositories**:
```
collectionregistry.azurecr.io/simplechat-backend:latest
collectionregistry.azurecr.io/simplechat-frontend:latest
```

#### Build & Push
```bash
# Build locally
docker build --platform linux/amd64 -t collectionregistry.azurecr.io/simplechat-frontend:latest .

# Push to ACR
az acr login --name collectionregistry
docker push collectionregistry.azurecr.io/simplechat-frontend:latest

# Or build directly in ACR
az acr build --registry collectionregistry --image simplechat-backend:latest --file Dockerfile .
```

#### Benefits
- **Private registry**: Secure image storage
- **Azure integration**: Works seamlessly with ACI
- **Geo-replication**: Available in higher SKUs
- **Webhook support**: Trigger deployments on push

### 4.7 Microsoft Entra ID (Azure AD)

#### Overview
Microsoft's cloud-based identity and access management service.

#### Role in SimpleChat
- **User authentication**: OAuth 2.0 / OpenID Connect
- **Single Sign-On (SSO)**: Enterprise identity integration
- **Token issuance**: JWT tokens for API authorization
- **App registration**: OAuth client configuration

#### App Registration

**Name**: `PgAzureMI`
**Application (client) ID**: `b29d2aae-f1d9-4c00-81ce-13e2848fe728`
**Tenant ID**: `a2b8448e-4362-4c41-ba77-8959e85aff31`

**Platform Configuration**:
- Type: Single Page Application (SPA)
- Redirect URIs:
  - `https://simplechat-endpoint-gcabh2fghfh6f0g4.z01.azurefd.net`
  - `http://localhost:5173` (development)

**API Permissions**:
- Microsoft Graph: `User.Read`
- Delegated permissions for user profile access

#### Authentication Flow

```
1. User clicks "Login"
2. Frontend redirects to Entra ID login page
3. User enters credentials
4. Entra ID validates and returns authorization code
5. Frontend exchanges code for access token (implicit flow)
6. Frontend stores token and sends with API requests
7. Backend validates token signature and claims
```

#### Token Validation (Backend)
```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"));
```

#### Benefits
- **Enterprise-grade security**: MFA, conditional access
- **No password management**: Delegated to Microsoft
- **Compliance**: SOC 2, ISO 27001, HIPAA
- **Audit logging**: All authentication events logged

### 4.8 Resource Organization

#### Resource Group Structure
```
rg-simplechat-demo (West US 2)
├── simplechat-afd (Front Door Profile)
├── simplechat-backend (Container Instance)
├── simplechat-frontend (Container Instance)
├── simplechat-sql-server (SQL Server)
│   └── SimpleChatDB (Database)
├── kv-simplechat-demo-2025 (Key Vault)
├── simplechat-communication (ACS Resource)
└── simplechat-backend-identity (Managed Identity)

collection-test-rg (Shared)
└── collectionregistry (Container Registry)
```

#### Naming Conventions
- Resource Group: `rg-<project>-<environment>`
- SQL Server: `<project>-sql-server`
- Container: `<project>-<component>`
- Key Vault: `kv-<project>-<environment>-<year>`
- Front Door: `<project>-afd`

---

## 5. Component Architecture

### 5.1 Backend Components

#### 5.1.1 API Layer (SimpleChat.API)

**Controllers**:

```
SimpleChat.API/Controllers/
├── AuthController.cs          # Authentication and ACS token generation
├── ChatsController.cs         # Chat thread and message management
└── UsersController.cs         # User profile and management
```

**AuthController**
- **Purpose**: Handle authentication and ACS token generation
- **Endpoints**:
  - `POST /api/auth/acs-token` - Generate ACS access token for authenticated user
- **Dependencies**: `IAzureCommunicationService`, `IUserService`

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    [HttpPost("acs-token")]
    public async Task<IActionResult> GetAcsToken()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var token = await _acsService.GetUserTokenAsync(userId);
        return Ok(new { token, expiresOn });
    }
}
```

**ChatsController**
- **Purpose**: Manage chat threads and messages
- **Endpoints**:
  - `POST /api/chats/threads` - Create or get existing thread
  - `GET /api/chats/threads/{threadId}` - Get thread details
  - `GET /api/chats/threads/{threadId}/messages` - Get message history
  - `POST /api/chats/threads/{threadId}/messages` - Send message (fallback)
  - `PUT /api/chats/threads/{threadId}/read` - Mark messages as read
- **Dependencies**: `IChatService`, `IMapper`

**UsersController**
- **Purpose**: User management and profile operations
- **Endpoints**:
  - `POST /api/users/get-or-create` - Get or create user with ACS identity
  - `GET /api/users/{userId}` - Get user profile
  - `GET /api/users` - List all users (for chat initiation)
- **Dependencies**: `IUserService`, `IAzureCommunicationService`

**Program.cs Configuration**:
```csharp
// Service registration
builder.Services.AddControllers();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Dependency injection
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IAzureCommunicationService, AzureCommunicationService>();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Logging
builder.Services.AddSerilog();
```

#### 5.1.2 Application Layer (SimpleChat.Application)

**Services**:

```
SimpleChat.Application/Services/
├── ChatService.cs             # Business logic for chat operations
├── UserService.cs             # Business logic for user operations
└── AzureCommunicationService.cs  # ACS integration
```

**ChatService**
```csharp
public class ChatService : IChatService
{
    public async Task<ChatThreadDto> CreateThreadAsync(string userId1, string userId2)
    {
        // 1. Check if thread already exists
        var existingThread = await _unitOfWork.ChatThreads
            .GetByParticipantsAsync(userId1, userId2);
        
        if (existingThread != null)
            return _mapper.Map<ChatThreadDto>(existingThread);
        
        // 2. Create ACS chat thread
        var acsThreadId = await _acsService.CreateChatThreadAsync(
            user1.AzureCommunicationUserId,
            user2.AzureCommunicationUserId
        );
        
        // 3. Save to database
        var thread = new ChatThread
        {
            AzureCommunicationThreadId = acsThreadId,
            Participants = new[] { user1, user2 }
        };
        
        await _unitOfWork.ChatThreads.AddAsync(thread);
        await _unitOfWork.SaveChangesAsync();
        
        return _mapper.Map<ChatThreadDto>(thread);
    }
}
```

**AzureCommunicationService**
```csharp
public class AzureCommunicationService : IAzureCommunicationService
{
    private readonly CommunicationIdentityClient _identityClient;
    private readonly ChatClient _chatClient;
    
    public async Task<string> CreateUserIdentityAsync()
    {
        var response = await _identityClient.CreateUserAsync();
        return response.Value.Id;
    }
    
    public async Task<AccessToken> GetUserTokenAsync(string acsUserId)
    {
        var user = new CommunicationUserIdentifier(acsUserId);
        var tokenResponse = await _identityClient.GetTokenAsync(
            user,
            scopes: new[] { CommunicationTokenScope.Chat }
        );
        return tokenResponse.Value;
    }
}
```

**DTOs**:
```
SimpleChat.Application/DTOs/
├── ChatThreadDto.cs           # Chat thread data transfer object
├── MessageDto.cs              # Message data transfer object
└── UserDto.cs                 # User data transfer object
```

**AutoMapper Profile**:
```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();
        CreateMap<ChatThread, ChatThreadDto>()
            .ForMember(dest => dest.OtherUser, opt => opt.MapFrom(src => GetOtherUser(src)));
        CreateMap<Message, MessageDto>();
    }
}
```

#### 5.1.3 Core Layer (SimpleChat.Core)

**Entities**:

```
SimpleChat.Core/Entities/
├── User.cs                    # User entity
├── ChatThread.cs              # Chat thread entity
├── Message.cs                 # Message entity
└── ChatThreadParticipant.cs   # Many-to-many relationship
```

**User Entity**:
```csharp
public class User
{
    public string Id { get; set; }  // Entra ID user ID
    public string AzureCommunicationUserId { get; set; }  // ACS user ID
    public string DisplayName { get; set; }
    public string Email { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    
    // Navigation properties
    public ICollection<ChatThreadParticipant> ThreadParticipants { get; set; }
    public ICollection<Message> Messages { get; set; }
}
```

**ChatThread Entity**:
```csharp
public class ChatThread
{
    public string Id { get; set; }  // Database ID
    public string AzureCommunicationThreadId { get; set; }  // ACS thread ID
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }
    
    // Navigation properties
    public ICollection<ChatThreadParticipant> Participants { get; set; }
    public ICollection<Message> Messages { get; set; }
}
```

**Message Entity**:
```csharp
public class Message
{
    public string Id { get; set; }  // ACS message ID
    public string ChatThreadId { get; set; }  // FK to ChatThread
    public string SenderId { get; set; }  // FK to User
    public string Content { get; set; }
    public MessageType Type { get; set; }  // Text, Image, File
    public DateTime SentAt { get; set; }
    public bool IsDeleted { get; set; }
    
    // Navigation properties
    public ChatThread ChatThread { get; set; }
    public User Sender { get; set; }
}
```

**Interfaces**:
```
SimpleChat.Core/Interfaces/
├── IUserRepository.cs
├── IChatThreadRepository.cs
└── IMessageRepository.cs
```

#### 5.1.4 Infrastructure Layer (SimpleChat.Infrastructure)

**Database Context**:
```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<ChatThread> ChatThreads { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ChatThreadParticipant> ChatThreadParticipants { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AzureCommunicationUserId).IsUnique();
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
        });
        
        // ChatThread configuration
        modelBuilder.Entity<ChatThread>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AzureCommunicationThreadId).IsUnique();
        });
        
        // Message configuration
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ChatThreadId, e.SentAt });
            entity.Property(e => e.Content).IsRequired();
        });
        
        // Many-to-many relationship
        modelBuilder.Entity<ChatThreadParticipant>()
            .HasKey(cp => new { cp.ChatThreadId, cp.UserId });
    }
}
```

**Repositories**:
```csharp
public class ChatThreadRepository : IChatThreadRepository
{
    private readonly ApplicationDbContext _context;
    
    public async Task<ChatThread?> GetByIdAsync(string id)
    {
        return await _context.ChatThreads
            .Include(t => t.Participants)
                .ThenInclude(p => p.User)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
    
    public async Task<IEnumerable<ChatThread>> GetUserThreadsAsync(string userId)
    {
        return await _context.ChatThreads
            .Include(t => t.Participants)
                .ThenInclude(p => p.User)
            .Where(t => t.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync();
    }
}
```

**Unit of Work**:
```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    
    public IUserRepository Users { get; }
    public IChatThreadRepository ChatThreads { get; }
    public IMessageRepository Messages { get; }
    
    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Users = new UserRepository(context);
        ChatThreads = new ChatThreadRepository(context);
        Messages = new MessageRepository(context);
    }
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
```

### 5.2 Frontend Components

#### 5.2.1 Page Components

**ChatPage.tsx**
- **Purpose**: Main chat interface container
- **Responsibilities**:
  - Load user's chat threads
  - Handle thread selection
  - Coordinate between UserList and ChatWindow
- **State**:
  - `threads`: List of chat threads
  - `selectedThread`: Currently selected thread
  - `loading`: Loading state

```typescript
export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  
  useEffect(() => {
    if (user) loadThreads();
  }, [user]);
  
  const handleNewChat = async (otherUserId: string) => {
    const thread = await apiService.getOrCreateThread(user.id, otherUserId);
    setThreads(prev => [thread, ...prev]);
    setSelectedThread(thread);
  };
  
  return (
    <Box>
      <ChatHeader />
      <Box display="flex">
        <UserList 
          threads={threads}
          selectedThread={selectedThread}
          onThreadSelect={setSelectedThread}
          onNewChat={handleNewChat}
        />
        <ChatWindow 
          thread={selectedThread}
          onMessageSent={loadThreads}
        />
      </Box>
    </Box>
  );
};
```

**LoginPage.tsx**
- **Purpose**: Authentication landing page
- **Responsibilities**:
  - Initiate Entra ID login flow
  - Handle authentication callbacks
  - Redirect to chat after successful login

#### 5.2.2 Feature Components

**ChatWindow.tsx**
- **Purpose**: Display and send messages for selected thread
- **Responsibilities**:
  - Initialize ACS connection
  - Load message history
  - Display messages
  - Send new messages
  - Handle typing indicators
- **Hooks Used**:
  - `useAcsChat`: ACS connection and messaging
  - `useAuth`: User context and ACS token
- **State**:
  - `messages`: Array of messages
  - `newMessage`: Current message input
  - `loading`: Message loading state

```typescript
export const ChatWindow: React.FC<ChatWindowProps> = ({ thread }) => {
  const { user, acsToken, acsEndpoint } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  
  const handleMessageReceived = useCallback((event: any) => {
    const message: Message = {
      id: event.id,
      content: event.message,  // Direct string property
      senderId: event.sender?.communicationUserId,
      sentAt: event.createdOn,
    };
    setMessages(prev => [...prev, message]);
  }, []);
  
  const { isConnected, sendMessage } = useAcsChat({
    threadId: thread?.azureCommunicationThreadId,
    onMessageReceived: handleMessageReceived,
  });
  
  const handleSendMessage = async (content: string) => {
    const messageId = await sendMessage(content);
    // Optimistic update already handled by ACS event
  };
  
  return (
    <Box>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <MessageInput onSend={handleSendMessage} />
    </Box>
  );
};
```

**UserList.tsx**
- **Purpose**: Display list of chat threads and users
- **Responsibilities**:
  - Show existing chat threads
  - Allow selecting threads
  - Enable starting new chats
  - Display user online status

**ChatHeader.tsx**
- **Purpose**: App header with user info and logout
- **Responsibilities**:
  - Display logged-in user
  - Logout functionality
  - Show connection status

#### 5.2.3 Custom Hooks

**useAcsChat.ts**
```typescript
export const useAcsChat = ({
  threadId,
  onMessageReceived,
}: UseAcsChatOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  
  const initializeChat = useCallback(async (token: string, endpoint: string) => {
    const eventHandlers = { onMessageReceived };
    await acsChatService.initialize(token, endpoint, eventHandlers);
    setIsConnected(true);
  }, [onMessageReceived]);
  
  const sendMessage = useCallback(async (content: string) => {
    return await acsChatService.sendMessage(content);
  }, []);
  
  return {
    isConnected,
    initializeChat,
    sendMessage,
    getThreadMessages,
  };
};
```

#### 5.2.4 Services

**acsChatService.ts**
```typescript
export class AcsChatService {
  private chatClient: ChatClient | null = null;
  private currentThreadId: string | null = null;
  
  async initialize(token: string, endpoint: string, handlers: AcsChatEventHandlers) {
    const tokenCredential = new AzureCommunicationTokenCredential(token);
    this.chatClient = new ChatClient(endpoint, tokenCredential);
    
    await this.chatClient.startRealtimeNotifications();
    this.setupEventHandlers(handlers);
  }
  
  private setupEventHandlers(handlers: AcsChatEventHandlers) {
    this.chatClient?.on('chatMessageReceived', (event) => {
      handlers.onMessageReceived?.(event);
    });
    
    this.chatClient?.on('typingIndicatorReceived', (event) => {
      handlers.onTypingIndicatorReceived?.(event);
    });
  }
  
  async sendMessage(content: string): Promise<string> {
    const chatThreadClient = this.chatClient!.getChatThreadClient(this.currentThreadId!);
    const result = await chatThreadClient.sendMessage({ content });
    return result.id;
  }
}

export const acsChatService = new AcsChatService();
```

**api.ts**
```typescript
class ApiService {
  private axiosInstance: AxiosInstance;
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add auth token to requests
    this.axiosInstance.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  async getOrCreateThread(userId1: string, userId2: string): Promise<ChatThread> {
    const response = await this.axiosInstance.post('/chats/threads', {
      user1Id: userId1,
      user2Id: userId2,
    });
    return response.data;
  }
}
```

#### 5.2.5 Context Providers

**AuthContext.tsx**
```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [user, setUser] = useState<User | null>(null);
  const [acsToken, setAcsToken] = useState<string | null>(null);
  const [acsEndpoint, setAcsEndpoint] = useState<string | null>(null);
  
  useEffect(() => {
    if (accounts.length > 0) {
      loadUser();
    }
  }, [accounts]);
  
  const loadUser = async () => {
    // Get Entra ID token
    const response = await instance.acquireTokenSilent({
      scopes: ['User.Read'],
      account: accounts[0],
    });
    
    // Get or create user in backend
    const userData = await apiService.getOrCreateUser();
    setUser(userData);
    
    // Get ACS token
    const acsTokenData = await apiService.getAcsToken();
    setAcsToken(acsTokenData.token);
    setAcsEndpoint(acsTokenData.endpoint);
  };
  
  return (
    <AuthContext.Provider value={{ user, acsToken, acsEndpoint, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 6. Data Flow

### 6.1 Authentication Flow

#### Complete Authentication Sequence

```
┌─────────┐                                    ┌──────────────┐
│ Browser │                                    │  Entra ID    │
└────┬────┘                                    └──────┬───────┘
     │                                                │
     │ 1. User clicks "Login"                        │
     ├──────────────────────────────────────────────►│
     │                                                │
     │ 2. Redirect to Microsoft login page           │
     │◄───────────────────────────────────────────────┤
     │                                                │
     │ 3. User enters credentials                     │
     ├──────────────────────────────────────────────►│
     │                                                │
     │ 4. Authentication + MFA (if enabled)           │
     │                                                │
     │ 5. Return JWT access token (implicit flow)    │
     │◄───────────────────────────────────────────────┤
     │                                                │
     ▼                                                │
┌─────────────┐                                      │
│   Frontend  │                                      │
│ Store token │                                      │
└──────┬──────┘                                      │
       │                                              │
       │ 6. POST /api/users/get-or-create            │
       │    Authorization: Bearer <jwt>              │
       ├──────────────────────────────────┐          │
       │                                  ▼          │
       │                          ┌───────────────┐  │
       │                          │   Backend     │  │
       │                          │   Validate    │  │
       │                          │   JWT token   │  │
       │                          └───────┬───────┘  │
       │                                  │          │
       │                                  │ 7. Create/Get user
       │                                  │    Create ACS identity
       │                                  │          │
       │                          ┌───────▼───────┐  │
       │                          │  Database +   │  │
       │                          │     ACS       │  │
       │                          └───────┬───────┘  │
       │                                  │          │
       │ 8. Return user data              │          │
       │◄─────────────────────────────────┤          │
       │                                  │          │
       │ 9. POST /api/auth/acs-token      │          │
       │    Authorization: Bearer <jwt>   │          │
       ├──────────────────────────────────►          │
       │                                  │          │
       │                          ┌───────▼───────┐  │
       │                          │   Generate    │  │
       │                          │   ACS token   │  │
       │                          └───────┬───────┘  │
       │                                  │          │
       │ 10. Return ACS token + endpoint  │          │
       │◄─────────────────────────────────┤          │
       │                                             │
       │ 11. Connect to ACS with token              │
       ├────────────────────────────────────────────►
       │                                  ┌──────────▼────────┐
       │                                  │        ACS        │
       │ 12. Real-time connection ready   │  (Chat Service)   │
       │◄─────────────────────────────────┤                   │
       │                                  └───────────────────┘
       ▼
```

**Key Points**:
- User authenticates once with Entra ID
- JWT token used for all backend API calls
- Separate ACS token generated for real-time messaging
- ACS token has 24-hour expiration, requires refresh

### 6.2 Chat Thread Creation Flow

```
Frontend (User A)                Backend API              Database        ACS
─────────────────────────────────────────────────────────────────────────────
     │
     │ 1. Select User B to chat
     │
     │ 2. POST /api/chats/threads
     │    { user1Id, user2Id }
     ├────────────────────────►
     │                              3. Check existing thread
     │                              ├──────────────────────►
     │                              │                      (Query by participants)
     │                              ◄──────────────────────┤
     │                              │                       │
     │                              │ 4. If not exists:     │
     │                              │    Get ACS user IDs   │
     │                              ├──────────────────────►
     │                              ◄──────────────────────┤
     │                              │                       │
     │                              │ 5. Create ACS thread  │
     │                              ├──────────────────────────────────────►
     │                              │                       │               │
     │                              │                       │   Create thread
     │                              │                       │   Add participants
     │                              ◄──────────────────────────────────────┤
     │                              │ (Return thread ID)    │               │
     │                              │                       │               │
     │                              │ 6. Save thread to DB  │               │
     │                              ├──────────────────────►│               │
     │                              │   (Map ACS ID to DB)  │               │
     │                              ◄──────────────────────┤               │
     │                              │                       │               │
     │ 7. Return thread details     │                       │               │
     ◄────────────────────────┤    │                       │               │
     │                              │                       │               │
     │ 8. Connect to thread         │                       │               │
     │    (using ACS SDK)            │                       │               │
     ├───────────────────────────────────────────────────────────────────────►
     │                              │                       │      Join thread
     │                              │                       │      Subscribe events
     ◄───────────────────────────────────────────────────────────────────────┤
     │ (Real-time connection ready) │                       │               │
     ▼                              ▼                       ▼               ▼
```

**Database State After Thread Creation**:
```sql
ChatThreads:
  Id: "uuid-generated"
  AzureCommunicationThreadId: "19:acsV2_TsE5gX6YIvERSZndTAHd-8LDcQ34dQbLgxVIyNHUmdQ1@thread.v2"
  CreatedAt: "2025-10-28T10:00:00Z"
  LastMessageAt: NULL

ChatThreadParticipants:
  ChatThreadId | UserId
  -------------|---------
  uuid-gen     | user-a-id
  uuid-gen     | user-b-id
```

### 6.3 Message Sending Flow (Real-time)

```
User A (Frontend)            ACS Service              User B (Frontend)         Backend API
────────────────────────────────────────────────────────────────────────────────────────────
     │                           │                           │                      │
     │ 1. Type message            │                           │                      │
     │    "Hello!"                │                           │                      │
     │                           │                           │                      │
     │ 2. Press Send             │                           │                      │
     │                           │                           │                      │
     │ 3. acsChatService         │                           │                      │
     │    .sendMessage("Hello!") │                           │                      │
     ├──────────────────────────►│                           │                      │
     │                           │                           │                      │
     │                           │ 4. Validate sender        │                      │
     │                           │    Check permissions      │                      │
     │                           │                           │                      │
     │ 5. Return message ID      │                           │                      │
     │    "1761676590856"        │                           │                      │
     ◄──────────────────────────┤                           │                      │
     │                           │                           │                      │
     │ 6. Optimistic UI update   │                           │                      │
     │    (Show message locally) │                           │                      │
     │                           │                           │                      │
     │                           │ 7. Deliver to recipients  │                      │
     │                           ├──────────────────────────►│                      │
     │                           │   chatMessageReceived     │                      │
     │                           │   event                   │                      │
     │                           │                           │                      │
     │                           │                           │ 8. Update UI         │
     │                           │                           │    (Show message)    │
     │                           │                           │                      │
     │                           │ 9. Send webhook to backend│                      │
     │                           │   (Event Grid)            │                      │
     │                           ├──────────────────────────────────────────────────►│
     │                           │                           │                      │
     │                           │                           │   10. Store in DB    │
     │                           │                           │       - Message      │
     │                           │                           │       - Update thread│
     │                           │                           │         LastMessageAt│
     │                           │                           │                      │
     │                           │ 11. Acknowledge webhook   │                      │
     │                           │◄──────────────────────────────────────────────────┤
     ▼                           ▼                           ▼                      ▼

Latency Breakdown:
- User A send → ACS:              ~30-50ms
- ACS → User B delivery:          ~30-50ms
- Total User A → User B:          ~60-100ms
- ACS → Backend webhook:          ~100-500ms (async, non-blocking)
```

**Event Data Structure (chatMessageReceived)**:
```json
{
  "id": "1761676590856",
  "threadId": "19:acsV2_TsE5gX6YIvERSZndTAHd...",
  "sender": {
    "kind": "communicationUser",
    "communicationUserId": "8:acs:81380eb7-211d-4431-8352..."
  },
  "message": "Hello!",
  "type": "Text",
  "createdOn": "2025-10-28T18:36:30.856Z",
  "version": "1761676590856"
}
```

**Frontend Message Handling**:
```typescript
const handleMessageReceived = useCallback((event: ChatMessageReceivedEvent) => {
  // Extract content directly from event.message property
  const messageContent = event.message; // "Hello!"
  
  const message: Message = {
    id: event.id,
    chatThreadId: event.threadId,
    senderId: event.sender.communicationUserId,
    content: messageContent,
    sentAt: event.createdOn,
  };
  
  // Add to UI
  setMessages(prev => [...prev, message].sort(bySentAt));
}, []);
```

### 6.4 Message History Loading Flow

```
Frontend                Backend API              Database        ACS
───────────────────────────────────────────────────────────────────
     │
     │ 1. Load chat thread
     │
     │ Approach A: Load from ACS (Primary)
     │ ────────────────────────────────────
     │
     │ 2. getThreadMessages()
     ├─────────────────────────────────────────────────────────────►
     │                                                     3. List messages
     │                                                        (paginated)
     │                                                               │
     │ 4. Return messages                                            │
     │    (with full history)                                        │
     ◄─────────────────────────────────────────────────────────────┤
     │                                                               │
     │ 5. Display in UI                                              │
     │
     │ Approach B: Load from Backend (Fallback)
     │ ────────────────────────────────────────
     │
     │ 6. GET /api/chats/threads/{id}/messages
     ├─────────────────────────►
     │                              7. Query database
     │                              ├──────────────────►
     │                              │  SELECT * FROM Messages
     │                              │  WHERE ChatThreadId = @id
     │                              │  ORDER BY SentAt ASC
     │                              ◄──────────────────┤
     │                              │                   │
     │ 8. Return messages           │                   │
     ◄─────────────────────────┤   │                   │
     │                              │                   │
     │ 9. Display in UI             │                   │
     ▼                              ▼                   ▼
```

**Why Two Approaches?**:
- **ACS (Primary)**: Fastest, already connected, real-time data
- **Backend (Fallback)**: Works when ACS connection fails, provides consistent API

### 6.5 Typing Indicator Flow

```
User A (Frontend)            ACS Service              User B (Frontend)
──────────────────────────────────────────────────────────────────────
     │                           │                           │
     │ 1. User starts typing     │                           │
     │    (keypress detected)    │                           │
     │                           │                           │
     │ 2. sendTypingIndicator()  │                           │
     │    (debounced, max 1/sec) │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │ 3. Broadcast to thread    │
     │                           ├──────────────────────────►│
     │                           │   typingIndicatorReceived │
     │                           │                           │
     │                           │                           │ 4. Show indicator
     │                           │                           │    "User A is typing..."
     │                           │                           │
     │ 5. User stops typing      │                           │
     │    (3 sec timeout)        │                           │
     │                           │                           │
     │                           │                           │ 6. Hide indicator
     │                           │                           │    (auto-timeout)
     ▼                           ▼                           ▼
```

**Implementation Detail**:
```typescript
// Debounced typing indicator (max once per second)
const sendTypingIndicator = debounce(async () => {
  await acsChatService.sendTypingIndicator();
}, 1000);

// On input change
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setNewMessage(e.target.value);
  sendTypingIndicator(); // Debounced call
};
```

### 6.6 Read Receipt Flow

```
User A sends message     →    User B receives & reads    →    User A sees "Read"
──────────────────────────────────────────────────────────────────────────────
     │                                    │                          │
     │ Message delivered                  │                          │
     ├───────────────────────────────────►│                          │
     │                                    │                          │
     │                                    │ 1. Message visible       │
     │                                    │    on screen             │
     │                                    │                          │
     │                                    │ 2. Send read receipt     │
     │                                    │    sendReadReceipt(msgId)│
     │                                    ├─────────────►            │
     │                                    │    (to ACS)  │            │
     │                                    │              │            │
     │                                                   │            │
     │ 3. Receive readReceiptReceived event             │            │
     │◄──────────────────────────────────────────────────┤            │
     │                                                                │
     │ 4. Update UI                                                   │
     │    Show "Read" status                                          │
     │    Display read time                                           │
     │                                                                │
     │ Also: Update backend via API                                  │
     ├────────────────────────────────────────────────────────────────►
     │ PUT /api/chats/threads/{id}/read                              │
     │                                                                │
     │ (Stores read status in database for persistence)              │
     ▼                                                                ▼
```

### 6.7 User Presence Flow

```
Frontend                 Backend API              ACS
──────────────────────────────────────────────────────
     │
     │ 1. User logs in
     │
     │ 2. Update user status
     ├──────────────────────►
     │                          3. Update DB
     │                          ├─────────────►
     │                          │  UPDATE Users
     │                          │  SET IsOnline = 1,
     │                          │      LastSeenAt = NOW()
     │                          ◄─────────────┤
     │                          │              │
     │ 4. Return success        │              │
     ◄──────────────────────┤  │              │
     │                          │              │
     │ 5. Periodic heartbeat    │              │
     │    (every 30 seconds)    │              │
     ├──────────────────────►  │              │
     │                          │              │
     │                          │ Update LastSeenAt
     │                          │              │
     │                          │              │
     │ On disconnect/logout     │              │
     ├──────────────────────►  │              │
     │                          │              │
     │                          │ 6. Set offline
     │                          ├─────────────►
     │                          │  UPDATE Users
     │                          │  SET IsOnline = 0
     ▼                          ▼              ▼
```

**Database Presence State**:
```sql
Users Table:
  Id           | IsOnline | LastSeenAt
  -------------|----------|-------------------
  user-a-id    | TRUE     | 2025-10-28 18:30:00
  user-b-id    | FALSE    | 2025-10-28 18:15:00
```

### 6.8 Error Handling Flow

```
Frontend                              Backend/ACS
─────────────────────────────────────────────────────
     │
     │ 1. Attempt operation
     ├──────────────────────────────►
     │                                  Error occurs
     │                                  (Network, Auth, etc.)
     │                                       │
     │ 2. Receive error response             │
     ◄─────────────────────────────────────┤
     │                                       │
     │ 3. Parse error                        │
     │    - Check error type                 │
     │    - Extract message                  │
     │                                       │
     │ 4. Handle based on type:              │
     │                                       │
     │    401 Unauthorized:                  │
     │    ├─► Refresh token                  │
     │    └─► Retry operation                │
     │                                       │
     │    403 Forbidden:                     │
     │    └─► Show permission error          │
     │                                       │
     │    500 Server Error:                  │
     │    ├─► Log to console                 │
     │    ├─► Show generic error             │
     │    └─► Optional: Retry with backoff   │
     │                                       │
     │    Network Error:                     │
     │    ├─► Show "Connection lost"         │
     │    └─► Attempt reconnect              │
     │                                       │
     │ 5. Display user-friendly message      │
     │    (Toast, Alert, or inline)          │
     ▼                                       ▼
```

**Error Handling Implementation**:
```typescript
try {
  await acsChatService.sendMessage(content);
} catch (error) {
  if (error.code === 'Unauthorized') {
    // Refresh ACS token and retry
    await refreshAcsToken();
    await acsChatService.sendMessage(content);
  } else if (error.code === 'NetworkError') {
    // Show offline message
    showToast('You are offline. Message will be sent when connection is restored.');
    // Queue message for retry
    queueMessageForRetry(content);
  } else {
    // Generic error
    showToast('Failed to send message. Please try again.');
    logger.error('Message send failed', error);
  }
}
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

#### Multi-Layer Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Layer 1: User Authentication              │
│                    Microsoft Entra ID (OAuth 2.0)            │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Layer 2: API Authorization                │
│                    JWT Token Validation                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Layer 3: ACS Authorization                │
│                    ACS User Token (Scoped)                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Layer 4: Azure Resource Access            │
│                    Managed Identity + RBAC                   │
└──────────────────────────────────────────────────────────────┘
```

#### Entra ID Authentication

**OAuth 2.0 Implicit Flow** (for SPA):

```typescript
// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: 'b29d2aae-f1d9-4c00-81ce-13e2848fe728',
    authority: 'https://login.microsoftonline.com/a2b8448e-4362-4c41-ba77-8959e85aff31',
    redirectUri: 'https://simplechat-endpoint-gcabh2fghfh6f0g4.z01.azurefd.net',
  },
  cache: {
    cacheLocation: 'sessionStorage', // Secure storage
    storeAuthStateInCookie: false,
  },
};

// Login
const loginRequest = {
  scopes: ['User.Read'],
};
await msalInstance.loginPopup(loginRequest);
```

**Token Structure**:
```json
{
  "aud": "b29d2aae-f1d9-4c00-81ce-13e2848fe728",
  "iss": "https://sts.windows.net/a2b8448e-4362-4c41-ba77-8959e85aff31/",
  "iat": 1698518400,
  "exp": 1698522000,
  "sub": "user-unique-identifier",
  "name": "John Doe",
  "email": "john.doe@company.com",
  "roles": ["User"]
}
```

#### Backend JWT Validation

```csharp
// Startup configuration
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        configuration.Bind("AzureAd", options);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    });

// Controller authorization
[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires valid JWT token
public class ChatsController : ControllerBase
{
    [HttpPost("threads")]
    public async Task<IActionResult> CreateThread(CreateThreadRequest request)
    {
        // Extract user ID from JWT claims
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        // Verify user is authorized for this operation
        if (userId != request.User1Id && userId != request.User2Id)
        {
            return Forbid(); // 403 Forbidden
        }
        
        // Proceed with operation...
    }
}
```

#### ACS Token Security

**Scoped Access Tokens**:
```csharp
// Generate ACS token with specific scopes
var scopes = new[] { CommunicationTokenScope.Chat };
var tokenResponse = await identityClient.GetTokenAsync(
    user,
    scopes: scopes,
    expiresIn: TimeSpan.FromHours(24)
);

// Token is scoped to:
// - Specific user identity
// - Chat operations only (not VoIP, SMS, etc.)
// - 24-hour expiration
```

**Token Refresh Strategy**:
```typescript
class AcsTokenManager {
  private token: string;
  private expiresOn: Date;
  
  async ensureValidToken(): Promise<string> {
    // Refresh if token expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() + fiveMinutes >= this.expiresOn.getTime()) {
      await this.refreshToken();
    }
    return this.token;
  }
  
  private async refreshToken() {
    const response = await apiService.getAcsToken();
    this.token = response.token;
    this.expiresOn = new Date(response.expiresOn);
  }
}
```

### 7.2 Data Security

#### Encryption

**In Transit**:
- **HTTPS Everywhere**: TLS 1.2+ for all communications
- **Frontend ↔ Entra ID**: HTTPS (OAuth 2.0)
- **Frontend ↔ Backend API**: HTTPS via Front Door
- **Frontend ↔ ACS**: WSS (WebSocket Secure)
- **Backend ↔ Azure SQL**: TLS encrypted connection
- **Backend ↔ Key Vault**: HTTPS with certificate pinning

**At Rest**:
- **Azure SQL Database**: Transparent Data Encryption (TDE) enabled by default
- **Key Vault Secrets**: Encrypted with HSM-backed keys
- **ACS Messages**: Encrypted at rest in Azure storage
- **Container Images**: Encrypted in Azure Container Registry

**Configuration**:
```json
// SQL Connection String - Encrypted connection required
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Encrypt=True;TrustServerCertificate=False;"
  }
}
```

#### Secret Management

**Azure Key Vault Integration**:

```csharp
// Program.cs - Key Vault configuration
var keyVaultUri = configuration["KeyVault:VaultUri"];
if (!string.IsNullOrEmpty(keyVaultUri))
{
    // Use managed identity to access Key Vault
    var credential = new DefaultAzureCredential();
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUri),
        credential
    );
}

// Secrets are loaded from Key Vault
var acsConnectionString = configuration["AzureCommunicationServices--ConnectionString"];
```

**Secret Naming Convention**:
```
Format: ComponentName--ConfigKey

Examples:
- AzureCommunicationServices--ConnectionString
- Database--AdminPassword
- ApiKeys--SendGrid
```

**Access Control**:
```
Key Vault: kv-simplechat-demo-2025
├── Access Policy: simplechat-backend-identity (Managed Identity)
│   └── Permissions: Get Secret, List Secrets
│
└── RBAC Role: Key Vault Secrets User
    └── Scope: Secret level (least privilege)
```

### 7.3 Network Security

#### Azure Front Door Security

**WAF (Web Application Firewall)**:
- DDoS protection (Layer 7)
- OWASP Top 10 protection
- Bot detection and mitigation
- Rate limiting per IP

**Security Policies**:
```json
{
  "wafPolicy": {
    "policySettings": {
      "enabledState": "Enabled",
      "mode": "Prevention",
      "requestBodyCheck": true
    },
    "managedRules": {
      "defaultRuleSets": [
        {
          "ruleSetType": "DefaultRuleSet",
          "ruleSetVersion": "1.0"
        }
      ]
    },
    "customRules": [
      {
        "name": "RateLimitRule",
        "priority": 1,
        "ruleType": "RateLimitRule",
        "rateLimitThreshold": 100,
        "rateLimitDurationInMinutes": 1
      }
    ]
  }
}
```

#### SQL Database Firewall

**Firewall Rules**:
```
1. AllowAzureServices (0.0.0.0 - 0.0.0.0)
   - Allows Azure services (ACI) to connect
   - Required for backend container access

2. Developer IPs (dynamic)
   - Added during deployment
   - Format: DeploymentIP-<timestamp>
   - Removed after development/testing
```

**Private Endpoint** (Production Enhancement):
```
┌─────────────────┐
│  Backend ACI    │
└────────┬────────┘
         │ Private connection
         ▼
┌─────────────────┐
│ Azure SQL DB    │
│ Private Endpoint│
└─────────────────┘

Benefits:
- No public IP exposure
- Traffic stays on Azure backbone
- Reduced attack surface
```

#### Container Network Security

**ACI Network Isolation**:
- Backend: HTTP only on port 8080 (Front Door terminates TLS)
- Frontend: HTTP only on port 80 (Front Door terminates TLS)
- No direct internet exposure (traffic via Front Door)

**Container Image Security**:
```bash
# Use specific base images (not latest)
FROM node:20-alpine  # ✅ Specific version
FROM nginx:alpine    # ✅ Minimal attack surface

# Not:
FROM node:latest     # ❌ Unpredictable changes
FROM ubuntu          # ❌ Large attack surface
```

### 7.4 Application Security

#### Input Validation

**Backend Validation**:
```csharp
[ApiController]
public class ChatsController : ControllerBase
{
    [HttpPost("threads/{threadId}/messages")]
    public async Task<IActionResult> SendMessage(
        [FromRoute] string threadId,
        [FromBody] SendMessageRequest request)
    {
        // Model validation (automatic with [ApiController])
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        
        // Business rule validation
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Message content cannot be empty");
        
        if (request.Content.Length > 8000)
            return BadRequest("Message too long (max 8000 characters)");
        
        // SQL Injection prevention (EF Core parameterized queries)
        var message = new Message
        {
            Content = request.Content, // EF Core handles escaping
            SenderId = userId
        };
        
        await _unitOfWork.Messages.AddAsync(message);
        await _unitOfWork.SaveChangesAsync();
        
        return Ok();
    }
}

// DTO with validation attributes
public class SendMessageRequest
{
    [Required]
    [StringLength(8000, MinimumLength = 1)]
    public string Content { get; set; }
}
```

**Frontend Validation**:
```typescript
const handleSendMessage = async (content: string) => {
  // Sanitize input
  const trimmed = content.trim();
  
  // Client-side validation
  if (!trimmed) {
    showError('Message cannot be empty');
    return;
  }
  
  if (trimmed.length > 8000) {
    showError('Message too long (max 8000 characters)');
    return;
  }
  
  // XSS prevention (React escapes by default)
  // Content is automatically escaped when rendered
  await acsSendMessage(trimmed);
};
```

#### CORS Configuration

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();
        
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .SetIsOriginAllowed(origin =>
              {
                  // Allow localhost for development
                  if (origin.StartsWith("http://localhost"))
                      return true;
                  
                  // Check against whitelist
                  return allowedOrigins.Contains(origin);
              });
    });
});
```

**CORS Origins**:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://simplechat-endpoint-gcabh2fghfh6f0g4.z01.azurefd.net",
      "http://localhost:5173",
      "http://localhost:3000"
    ]
  }
}
```

#### SQL Injection Prevention

**Entity Framework Core** (Parameterized Queries):
```csharp
// ✅ SAFE - EF Core uses parameterized queries
var messages = await _context.Messages
    .Where(m => m.ChatThreadId == threadId)
    .ToListAsync();

// Generated SQL (parameterized):
// SELECT * FROM Messages WHERE ChatThreadId = @p0

// ❌ UNSAFE - Raw SQL without parameters
var query = $"SELECT * FROM Messages WHERE ChatThreadId = '{threadId}'";
await _context.Messages.FromSqlRaw(query).ToListAsync();

// ✅ SAFE - Raw SQL with parameters
await _context.Messages
    .FromSqlRaw("SELECT * FROM Messages WHERE ChatThreadId = {0}", threadId)
    .ToListAsync();
```

#### Cross-Site Scripting (XSS) Prevention

**React Automatic Escaping**:
```typescript
// ✅ SAFE - React automatically escapes
<Typography>{message.content}</Typography>

// Rendered as:
// <p>Hello &lt;script&gt;alert('xss')&lt;/script&gt;</p>

// ❌ UNSAFE - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: message.content }} />

// If needed, sanitize first:
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(message.content);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### 7.5 Managed Identity & RBAC

#### Managed Identity Architecture

```
┌──────────────────────────────────────────────────────────┐
│           simplechat-backend (Container Instance)         │
│                                                           │
│  Assigned Identity:                                       │
│  simplechat-backend-identity                              │
│  Principal ID: <guid>                                     │
│  Client ID: <guid>                                        │
└─────────────────────┬────────────────────────────────────┘
                      │
                      │ No credentials needed
                      │ Azure handles authentication
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│   Key Vault      │      │       ACS        │
│                  │      │                  │
│ RBAC Role:       │      │ RBAC Role:       │
│ Key Vault        │      │ Contributor      │
│ Secrets User     │      │ (Resource Group) │
└──────────────────┘      └──────────────────┘
```

**RBAC Assignments**:
```bash
# Key Vault access
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/.../providers/Microsoft.KeyVault/vaults/kv-simplechat-demo-2025

# ACS access (if needed for admin operations)
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Contributor" \
  --scope /subscriptions/.../resourceGroups/rg-simplechat-demo/providers/Microsoft.Communication/communicationServices/simplechat-communication
```

**Code Implementation**:
```csharp
// DefaultAzureCredential tries in order:
// 1. Environment variables
// 2. Managed Identity (in Azure)
// 3. Visual Studio credentials (local dev)
// 4. Azure CLI credentials (local dev)
var credential = new DefaultAzureCredential();

// Key Vault client
var secretClient = new SecretClient(
    new Uri(keyVaultUri),
    credential // Automatically uses managed identity in Azure
);

// ACS client
var identityClient = new CommunicationIdentityClient(
    connectionString // Retrieved from Key Vault
);
```

### 7.6 Security Best Practices

#### Principle of Least Privilege

**Applied at Every Level**:
1. **Managed Identity**: Only Key Vault Secrets User, not Admin
2. **SQL User**: App uses separate login, not sa
3. **ACS Tokens**: Scoped to Chat only, not all communication
4. **API Authorization**: User can only access their own data

#### Defense in Depth

**Multiple Security Layers**:
```
Layer 1: Front Door WAF → DDoS, Bot protection
Layer 2: HTTPS/TLS     → Encryption in transit
Layer 3: Entra ID      → User authentication
Layer 4: JWT Tokens    → API authorization
Layer 5: RBAC          → Resource access control
Layer 6: Input Validation → Injection prevention
Layer 7: TDE           → Encryption at rest
```

#### Security Monitoring

**Logging Security Events**:
```csharp
// Authentication failures
_logger.LogWarning(
    "Authentication failed for user {UserId} from IP {IpAddress}",
    userId,
    httpContext.Connection.RemoteIpAddress
);

// Authorization failures
_logger.LogWarning(
    "Unauthorized access attempt: User {UserId} tried to access thread {ThreadId}",
    userId,
    threadId
);

// Suspicious activity
_logger.LogError(
    "Potential attack detected: {AttackType} from {IpAddress}",
    "SQL Injection Attempt",
    ipAddress
);
```

**Azure Monitor Integration**:
- Application Insights for application logs
- Azure SQL audit logs for database access
- Key Vault audit logs for secret access
- Front Door WAF logs for attack attempts

#### Regular Security Updates

**Container Base Images**:
```dockerfile
# Regularly update base images
FROM node:20-alpine
# Update packages in container
RUN apk update && apk upgrade

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
# Alpine is updated with each build
```

**Dependency Updates**:
```bash
# Frontend
npm audit
npm audit fix

# Backend
dotnet list package --vulnerable
dotnet add package <PackageName> --version <LatestSecureVersion>
```


---

## 8. Deployment Architecture

### 8.1 Overview

This section documents how the application is built, containerized, tested and deployed to Azure. The primary goals are repeatability, minimal manual steps, strong security (secrets in Key Vault / managed identity), and fast rollback strategies.

High-level flow:

```
Developer (local) -> GitHub (main) -> CI (build, test, scan) -> Push to ACR -> CD (deploy to Staging ACI) -> Smoke tests -> Promote to Production ACI -> Front Door routes traffic
```

Environments:
- Development: local Docker / dev.sh
- Staging: ACI instance with `-staging` suffix behind Front Door staging route
- Production: ACI instance behind Front Door production route

### 8.2 Containerization

Best practices used:
- Multi-stage Dockerfiles to keep images small
- Pin base image versions (e.g. `node:20-alpine`, `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`)
- Build for linux/amd64 for Azure compatibility
- Scan images (npm audit, Trivy / ACR Tasks vulnerability scanning)

Example `Dockerfile` (frontend simplified):

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Docker build (recommended CI command):

```bash
docker buildx build --platform linux/amd64 --push \
  -t collectionregistry.azurecr.io/simplechat-frontend:${GITHUB_SHA::8} .
```

### 8.3 CI/CD (GitHub Actions example)

Goals:
- Build and test frontend & backend
- Static analysis & vulnerability scans
- Build multi-arch images and push to ACR
- Deploy to staging ACI and run smoke tests
- Manual approval / automated promotion to production

Example (abridged) GitHub Actions workflow outline:

```yaml
name: CI/CD
on:
  push:
    branches: [ main ]

jobs:
  build-and-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm run build --prefix frontend
      - name: Run frontend tests
        run: npm test --prefix frontend --silent
      - name: Build and push images
        uses: azure/docker-login@v1
        with:
          login-server: collectionregistry.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - run: |
          docker buildx create --use
          docker buildx build --platform linux/amd64 --push \
            -t collectionregistry.azurecr.io/simplechat-frontend:${{ github.sha }} ./frontend
          docker buildx build --platform linux/amd64 --push \
            -t collectionregistry.azurecr.io/simplechat-backend:${{ github.sha }} ./src/backend/SimpleChat.API

  deploy-staging:
    needs: build-and-scan
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ACI (staging)
        run: |
          az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} -p ${{ secrets.AZURE_CLIENT_SECRET }} --tenant ${{ secrets.AZURE_TENANT_ID }}
          az acr login --name collectionregistry
          az container create --resource-group rg-simplechat-demo --name simplechat-frontend-staging \
            --image collectionregistry.azurecr.io/simplechat-frontend:${{ github.sha }} --cpu 0.5 --memory 1 \
            --environment-variables ASPNETCORE_ENVIRONMENT=Staging

  promote-production:
    needs: deploy-staging
    if: ${{ github.event.inputs.promote == 'true' }} # or manual approval
    runs-on: ubuntu-latest
    steps:
      - name: Swap staging -> production
        run: |
          # Replace ACI production image with new tag or update Front Door origin to point to new ACI instance
          az container create --resource-group rg-simplechat-demo --name simplechat-frontend --image collectionregistry.azurecr.io/simplechat-frontend:${{ github.sha }} --cpu 0.5 --memory 1
```

Notes:
- Use GitHub environment protection rules for `promote-production` (required reviewers, manual approvals).
- Store ACR and Azure credentials in GitHub Secrets or use OIDC federation for short-lived tokens.

### 8.4 Infrastructure as Code (IaC)

Prefer Bicep or Terraform for reproducible resource creation. Minimal artifacts:

- Bicep modules for:
  - Azure Container Registry
  - Azure Container Instances (frontend/backend)
  - Azure SQL Database
  - Key Vault + access policies
  - Front Door profile and routing rules

Example Bicep snippet (ACI + ACR role assignment):

```bicep
resource acr 'Microsoft.ContainerRegistry/registries@2022-02-01' existing = {
  name: 'collectionregistry'
}

resource container 'Microsoft.ContainerInstance/containerGroups@2021-03-01' = {
  name: 'simplechat-frontend'
  location: resourceGroup().location
  properties: {
    containers: [
      {
        name: 'frontend'
        properties: {
          image: '${acr.properties.loginServer}/simplechat-frontend:latest'
          resources: { requests: { cpu: 0.5, memoryInGb: 1 } }
          ports: [ { port: 80 } ]
        }
      }
    ]
    osType: 'Linux'
  }
}
```

### 8.5 Deployment Patterns & Strategies

- Blue/Green or Canary: Deploy new container to a staging ACI, run integration/smoke tests, then switch Front Door origin or route percentage of traffic.
- Rolling update via ACI: Create new instance with suffix, update Front Door origin group to point to new instance, then delete old instance.
- Health checks: Front Door configured with HTTP health probes (`/health`) against each origin. Backend Kestrel exposes `/health` returning 200 when DB, Key Vault and ACS connectivity checks pass.
- Readiness & Liveness: Use container-level probes in orchestrators (if moving to AKS later). For ACI rely on application `/health` and restart policies.

### 8.6 Secrets and Configuration in Deployments

- Do not bake secrets into images. Use Key Vault + Managed Identity for backend.
- For ACI: pass Key Vault Uri via environment variable and let the app use `DefaultAzureCredential`.
- Use ACR managed identities or OIDC to avoid long-lived service principal secrets in CI.

Example ACI environment config (production):

```bash
az container create \
  --resource-group rg-simplechat-demo \
  --name simplechat-backend \
  --image collectionregistry.azurecr.io/simplechat-backend:latest \
  --assign-identity \
  --environment-variables "KeyVault__VaultUri=https://kv-simplechat-demo-2025.vault.azure.net/" "ASPNETCORE_ENVIRONMENT=Production"
```

### 8.7 Health Checks & Rollback

- Health endpoint `/health` should perform:
  - DB connectivity check (simple read)
  - Key Vault secret retrieval test (GetSecret version)
  - ACS reachability (token refresh trial)

- Automated rollback strategies:
  1. CI deploys to staging and runs smoke tests; if they fail, do not promote.
  2. On production deploy failure (route errors, high 5xx), automatically revert Front Door origin to previous instance.
  3. Keep last 3 image tags to quickly redeploy a known-good image.

### 8.8 Observability & Verification

- After deployment run quick verification:
  - `curl -I https://<frontdoor>/health` → should return 200
  - Check Application Insights for any sudden error spikes
  - Validate ACS connectivity by sending a test message using a test account

### 8.9 Notes & Next Steps

- For higher scale or more advanced deployment control consider migrating from ACI to AKS with KEDA for autoscaling and native rolling updates.
- Use OIDC federation from GitHub Actions to Azure AD to avoid storing long-lived credentials in GitHub Secrets.
 - Use OIDC federation from GitHub Actions to Azure AD to avoid storing long-lived credentials in GitHub Secrets.

---

## 9. Real-time Messaging

### 9.1 Purpose

This section describes how Azure Communication Services (ACS) is used for real-time chat, including SDK usage patterns, event handling, reconnection strategies, message ordering/delivery semantics, webhook persistence, and fallback patterns when ACS is unavailable.

### 9.2 ACS Integration Overview

- Frontend connects directly to ACS using a short-lived ACS token generated by the backend.
- ACS is the primary data plane for real-time events (messages, typing, read receipts, presence).
- Backend receives webhook events from ACS (Event Grid or ACS callbacks) for persistence and audit.

Architecture summary:

```
Frontend (browser) --(WSS)--> ACS (Chat Service) --(Event Grid/Webhooks)--> Backend (persist)
```

### 9.3 SDK Usage (Frontend)

Key ideas:
- Use `@azure/communication-chat` and `@azure/communication-common`.
- Initialize a `ChatClient` with `AzureCommunicationTokenCredential` (token from backend).
- Use the realtime messenger APIs to subscribe to `chatMessageReceived`, `typingIndicatorReceived`, `readReceiptReceived`, and `participants*` events.

Example (TypeScript):

```typescript
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

async function initializeAcs(token: string, endpoint: string, threadId: string) {
  const credential = new AzureCommunicationTokenCredential(token);
  const chatClient = new ChatClient(endpoint, credential);
  await chatClient.startRealtimeNotifications();

  const threadClient = await chatClient.getChatThreadClient(threadId);

  chatClient.on('chatMessageReceived', (event) => {
    // event.message is a direct string for Text events
    handleIncomingMessage({
      id: event.id,
      content: event.message,
      sender: event.sender?.communicationUserId,
      createdOn: event.createdOn,
    });
  });

  chatClient.on('typingIndicatorReceived', (ev) => handleTyping(ev));
  chatClient.on('readReceiptReceived', (ev) => handleReadReceipt(ev));
}
```

### 9.4 Reconnection Strategy

Goals: restore real-time presence quickly, avoid thundering herd, and preserve event ordering where possible.

Recommended approach:
- Use exponential backoff with jitter for reconnect attempts (e.g., base=1s, max=60s).
- Limit concurrent reconnection attempts per client (debounce reconnect events from network flaps).
- On reconnect, re-sync thread state: request message history (last N messages) from ACS or backend to fill any gaps.

Example backoff (JS):

```typescript
function backoff(attempt: number) {
  const base = 1000; // 1s
  const max = 60000; // 60s
  const jitter = Math.random() * 300;
  return Math.min(max, base * 2 ** attempt) + jitter;
}

async function tryReconnect(connectFn) {
  let attempt = 0;
  while (attempt < 10) {
    try {
      await connectFn();
      return; // success
    } catch (e) {
      const wait = backoff(attempt++);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  // notify user and switch to fallback (offline queue)
}
```

### 9.5 Message Ordering & Delivery Guarantees

- ACS provides ordered delivery per thread for messages originating through ACS.
- Delivery semantics: ACS aims for at-least-once delivery to online participants; clients should implement idempotency for processing duplicates.
- Use message IDs from ACS (`event.id`) to deduplicate messages when persisting locally.

Deduplication pattern (frontend/backend):
- Keep a sliding window or a recent message cache of processed message IDs to avoid duplicate UI inserts.
- When webhook persists messages, ensure idempotent inserts using ACS message ID as primary key.

Example DB schema constraint (pseudo-SQL):

```sql
ALTER TABLE Messages
ADD CONSTRAINT UQ_Messages_AcsMessageId UNIQUE (Id);
```

### 9.6 Webhook Persistence & Processing

Backend webhook handler responsibilities:
- Validate the webhook signature (Event Grid validation or ACS signature) to prevent tampering.
- Parse event type (MessageReceived, TypingIndicator, ReadReceipt).
- For MessageReceived:
  - If event contains full content: attempt idempotent insert using event.id as key.
  - If content missing or partial, fetch message content via ACS REST API or rely on frontend to resend via fallback API.
- Acknowledge the webhook quickly (HTTP 200) and enqueue heavy processing to background worker if necessary.

Example (C# webhook handler outline):

```csharp
[HttpPost("/webhooks/acs")]
public async Task<IActionResult> AcsWebhook([FromBody] EventGridEvent[] events)
{
    foreach (var e in events)
    {
        // Validate signature (if configured)
        var type = e.EventType;
        if (type == "Microsoft.Communication.ChatMessageReceived")
        {
            var payload = e.Data.ToObjectFromJson<ChatMessageReceivedPayload>();
            // Upsert message by Id
            await _messageService.UpsertFromAcsAsync(payload.Id, payload.ThreadId, payload.SenderId, payload.Message, payload.CreatedOn);
        }
    }
    return Ok();
}
```

### 9.7 Fallback Patterns

When ACS is unavailable or webhook delivery delayed, implement fallback:

1. Frontend fallback send: POST to `/api/chats/threads/{threadId}/messages` on backend which will persist to DB and attempt to send via ACS when available.
2. Offline queue: store pending messages locally (IndexedDB) and flush on reconnect.
3. Webhook retry: backend uses a durable queue (Azure Storage Queue / Service Bus) to retry processing failed events and implements dead-letter handling after N attempts.

### 9.8 Throttling, Rate Limits & Message Size

- Respect ACS provider limits (apply client-side rate limiting for sends and typing indicators).
- Implement server-side rate limiting for API endpoints (e.g., 30 messages per minute per user) to prevent abuse.
- Enforce maximum message size on frontend and backend (8000 chars configured elsewhere) and respond with 413 if exceeded.

### 9.9 Presence, Typing & Read Receipts

- Use ACS realtime events for presence and typing indicators.
- For presence, send periodic heartbeats and update LastSeen in backend for durable presence state.
- For read receipts, handle `readReceiptReceived` events on clients and persist read timestamps in DB for audit.

### 9.10 Testing Recommendations

- Integration tests for realtime flows using a test ACS resource and test users.
- Simulate network partitions and ensure reconnection/backoff works and messages are de-duplicated correctly.
- End-to-end test: send message from User A → verify User B receives → verify webhook persisted it to DB.

### 9.11 Observability

- Instrument ACS event handlers and webhook endpoints with tracing (Application Insights) and add metrics:
  - messages_received_total
  - webhook_processing_errors
  - webhook_queue_length
  - reconnection_attempts

---
 
## 10. Database Schema

### 10.1 Goals and Constraints

The database schema is designed for durable message persistence, fast reads for recent conversations, and efficient archival for older messages. Goals:
- Ensure ordered retrieval of messages by thread (ascending by SentAt)
- Provide idempotent persistence for messages received via ACS webhooks
- Minimize write contention on hot threads
- Support efficient queries for user threads and unread counts

Constraints:
- Use Azure SQL (relational features, backups), scale via compute tier
- Messages expected to grow large; plan for partitioning/archival

### 10.2 Key Entities (ERD outline)

Primary tables:
- Users
- ChatThreads
- ChatThreadParticipants
- Messages
- MessageAttachments (optional)
- ReadReceipts

ERD (simplified):

```
Users 1---* ChatThreadParticipants *---1 ChatThreads 1---* Messages *---0..* MessageAttachments
                  |
                  *
               ReadReceipts
```

### 10.3 Table Definitions

Users
```sql
CREATE TABLE Users (
  Id NVARCHAR(128) PRIMARY KEY, -- Entra ID or app-generated GUID
  AzureCommunicationUserId NVARCHAR(128) UNIQUE,
  DisplayName NVARCHAR(200) NOT NULL,
  Email NVARCHAR(320) NOT NULL,
  AvatarUrl NVARCHAR(1024) NULL,
  IsOnline BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  LastSeenAt DATETIME2 NULL
);
CREATE INDEX IX_Users_Email ON Users(Email);
```

ChatThreads
```sql
CREATE TABLE ChatThreads (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  AzureCommunicationThreadId NVARCHAR(256) UNIQUE,
  Topic NVARCHAR(256) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  LastMessageAt DATETIME2 NULL
);
```

ChatThreadParticipants
```sql
CREATE TABLE ChatThreadParticipants (
  ChatThreadId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(128) NOT NULL,
  JoinedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  PRIMARY KEY (ChatThreadId, UserId),
  FOREIGN KEY (ChatThreadId) REFERENCES ChatThreads(Id),
  FOREIGN KEY (UserId) REFERENCES Users(Id)
);
CREATE INDEX IX_Participants_UserId ON ChatThreadParticipants(UserId);
```

Messages
```sql
CREATE TABLE Messages (
  Id NVARCHAR(128) PRIMARY KEY, -- Use ACS message id when available
  ChatThreadId UNIQUEIDENTIFIER NOT NULL,
  SenderId NVARCHAR(128) NOT NULL,
  Content NVARCHAR(MAX) NOT NULL,
  Type TINYINT NOT NULL DEFAULT 0, -- 0=Text,1=Image,2=File
  SentAt DATETIME2 NOT NULL,
  IsDeleted BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Messages_ChatThread FOREIGN KEY (ChatThreadId) REFERENCES ChatThreads(Id),
  CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId) REFERENCES Users(Id)
);
-- Ensure quick retrieval by thread ordered by SentAt
CREATE INDEX IX_Messages_ChatThread_SentAt ON Messages(ChatThreadId, SentAt DESC);
-- Uniqueness on Id prevents duplicate inserts from webhooks
```

MessageAttachments (optional)
```sql
CREATE TABLE MessageAttachments (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  MessageId NVARCHAR(128) NOT NULL,
  Url NVARCHAR(2048) NOT NULL,
  MimeType NVARCHAR(256) NULL,
  SizeBytes BIGINT NULL,
  FOREIGN KEY (MessageId) REFERENCES Messages(Id)
);
```

ReadReceipts
```sql
CREATE TABLE ReadReceipts (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
  MessageId NVARCHAR(128) NOT NULL,
  ReaderId NVARCHAR(128) NOT NULL,
  ReadAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  FOREIGN KEY (MessageId) REFERENCES Messages(Id),
  FOREIGN KEY (ReaderId) REFERENCES Users(Id)
);
CREATE INDEX IX_ReadReceipts_Message ON ReadReceipts(MessageId);
```

### 10.4 Indexing & Query Patterns

Common queries and recommended indexes:
- Get recent threads for a user: join ChatThreadParticipants -> ChatThreads ordered by LastMessageAt (index on LastMessageAt)
- Get messages for a thread (paginated): use IX_Messages_ChatThread_SentAt and OFFSET/FETCH
- Get unread counts: consider maintaining a per-user per-thread UnreadCounters table to avoid expensive COUNT queries on Messages

Index suggestions:
- IX_ChatThreads_LastMessageAt (ChatThreads.LastMessageAt DESC)
- IX_Messages_ChatThread_SentAt (ChatThreadId, SentAt DESC)
- IX_Participants_UserId (ChatThreadParticipants.UserId)

### 10.5 Migrations & EF Core Mapping

Entity configuration examples (EF Core fluent):

```csharp
modelBuilder.Entity<Message>(b => {
  b.HasKey(m => m.Id);
  b.HasIndex(m => new { m.ChatThreadId, m.SentAt });
  b.Property(m => m.Content).IsRequired();
});
```

Migration strategy:
- Use EF Core Migrations for schema versioning
- Keep migrations small and incremental
- Test migrations against a copy of production schema (staging DB) before applying to prod
- Backup DB before applying major schema changes

### 10.6 Data Retention & Archival

Retention policy recommendation:
- Keep hot messages online for 90 days by default
- Archive messages older than 90 days to an append-only storage (Azure Blob Storage) in compressed batches (parquet/JSON)
- Retain archived blobs for 1–3 years depending on compliance
- Allow rehydration: provide a background job to restore archived messages into DB if needed (for search / legal requests)

Archival workflow:
1. Background job queries messages older than retention window in batches (e.g., 10k rows)
2. Serialize to compressed file and upload to Blob storage container `simplechat-archives/yyyy/MM/dd/part-xxxxx.parquet`
3. Delete archived rows from Messages table after successful upload and verification

### 10.7 Partitioning & Sharding (when needed)

For large scale (many millions of messages):
- Horizontal partitioning by ChatThreadId using table partitioning (range by CreatedAt) or sharding by thread hash
- Consider using Azure SQL Hyperscale or moving historical archives to Cosmos DB / Data Lake for analytics

### 10.8 Backups, Restore & Maintenance

- Use Azure SQL automated backups and point-in-time restore
- Regularly test restore process in staging
- Monitor long-running queries and index fragmentation; schedule index rebuilds during low-traffic windows

### 10.9 Security & Compliance

- PII fields (email, display name) are stored in DB — ensure TDE (Azure SQL has TDE by default) and appropriate RBAC access
- Audit access with Azure SQL auditing
- Mask or encrypt sensitive columns if required by policy

### 10.10 Monitoring & Operational Metrics

Track:
- Message insert rate
- Average message retrieval latency
- Archive job success/failure rate
- DB CPU, DTU / vCore usage and storage growth

---

## 11. API Design

### 11.1 Goals

API design goals for SimpleChat:
- Simple, RESTful semantics for metadata operations (threads, users, history)
- Clear separation between control plane (API) and data plane (ACS)
- Secure endpoints using JWT tokens (Entra ID)
- Idempotent and observable operations
- Support pagination and efficient reads for chat history

Versioning
- Use URL versioning for simplicity and cache friendliness: `/api/v1/...`
- Keep a migration plan: support 2 active versions (current + previous) and deprecate older versions with notifications.

### 11.2 Base Patterns

- Authentication: Bearer JWT token required for all `/api/*` endpoints.
- Correlation: require `X-Correlation-ID` header for important requests (used by logs/traces).
- Idempotency: Add `Idempotency-Key` header for message-send fallback and other write operations.
- Rate limiting: Return `429 Too Many Requests` with `Retry-After` header.

### 11.3 Endpoints (summary)

Base path: `/api/v1`

Auth
- `POST /auth/acs-token` — generate ACS token for the authenticated user

Users
- `POST /users/get-or-create` — body: { userId?, displayName?, email? } → returns UserDto (creates mapping to ACS identity)
- `GET /users/{userId}` — returns UserDto
- `GET /users` — list users (admin or limited scope)

Threads & Messages
- `POST /chats/threads` — create/get thread
  - body: { user1Id, user2Id } → returns ChatThreadDto
- `GET /chats/threads` — list user's threads (paged)
- `GET /chats/threads/{threadId}` — get thread info
- `GET /chats/threads/{threadId}/messages?cursor={cursor}&pageSize={n}` — paged messages (cursor-based preferred)
- `POST /chats/threads/{threadId}/messages` — fallback send (idempotent)
  - headers: `Idempotency-Key` optional
  - body: { id?, content, type } — returns MessageDto (persisted)
- `PUT /chats/threads/{threadId}/read` — mark messages read (body: { messageId? | upToTimestamp? })

Admin / Diagnostics
- `GET /health` — app health (DB, Key Vault, ACS checks)
- `GET /metrics` — lightweight metrics (authenticated for admins)

### 11.4 DTOs (examples)

UserDto (C#)
```csharp
public class UserDto
{
  public string Id { get; set; }
  public string DisplayName { get; set; }
  public string Email { get; set; }
  public string AzureCommunicationUserId { get; set; }
  public bool IsOnline { get; set; }
}
```

ChatThreadDto
```csharp
public class ChatThreadDto
{
  public Guid Id { get; set; }
  public string AzureCommunicationThreadId { get; set; }
  public IEnumerable<UserDto> Participants { get; set; }
  public DateTime? LastMessageAt { get; set; }
}
```

MessageDto
```csharp
public class MessageDto
{
  public string Id { get; set; } // Use ACS id when available
  public Guid ChatThreadId { get; set; }
  public string SenderId { get; set; }
  public string Content { get; set; }
  public DateTime SentAt { get; set; }
}
```

### 11.5 Sample Requests & Responses

Create thread

Request
```
POST /api/v1/chats/threads
Authorization: Bearer <jwt>
Content-Type: application/json

{ "user1Id": "user-a-id", "user2Id": "user-b-id" }
```

Response 200
```json
{
  "id": "c3f3f2d0-...",
  "azureCommunicationThreadId": "19:acsV2_...@thread.v2",
  "participants": [ { /* UserDto */ } ],
  "lastMessageAt": null
}
```

Send fallback message (idempotent)

Request
```
POST /api/v1/chats/threads/{threadId}/messages
Authorization: Bearer <jwt>
Idempotency-Key: 6b6b7a2f-... 
Content-Type: application/json

{ "id": "1761676590856", "content": "Hello via backend" }
```

Responses
- 201 Created — message persisted and queued to ACS
- 200 OK — if idempotency key already processed (return existing MessageDto)
- 409 Conflict — message id exists but differs in content

### 11.6 Error Handling & HTTP Status Codes

- 200 OK — Success
- 201 Created — Resource created
- 400 Bad Request — Validation error
- 401 Unauthorized — Missing/invalid JWT
- 403 Forbidden — Access denied to resource
- 404 Not Found — Resource not present
- 409 Conflict — Idempotency or duplicate resource conflict
- 413 Payload Too Large — Message body exceeds allowed size
- 429 Too Many Requests — Client rate limit
- 500 Internal Server Error — Unexpected failures; include correlation id

Error payload (standardized)
```json
{
  "error": {
    "code": "BadRequest",
    "message": "Message too long",
    "details": [ { "field":"content", "message":"Max 8000 characters" } ],
    "correlationId": "..."
  }
}
```

### 11.7 Pagination & Cursor Strategy

- Prefer cursor-based pagination for message history. Cursor contains last-seen SentAt + Id to handle identical timestamps.
- Example response for `GET /messages`:
```json
{
  "items": [ /* MessageDto[] */ ],
  "nextCursor": "eyJzZW50QXQiOiIyMDI1LTAxLTAxVDAwOjAwOjAwWiIsImlkIjoiMTIzIn0=",
  "pageSize": 50
}
```

Server should return `nextCursor` (opaque token) and support `?cursor=` to continue.

### 11.8 Idempotency & Deduplication

- For writes that must be safe to retry (fallback send), accept `Idempotency-Key` and persist a mapping (IdempotencyKey -> ResourceId, ExpiresAt).
- If client supplies message `id` (ACS id), use it as primary key in DB (dedupe on insert); otherwise rely on Idempotency-Key.

Example idempotency table (simplified):
```sql
CREATE TABLE IdempotencyKeys (
  Key NVARCHAR(128) PRIMARY KEY,
  ResourceId NVARCHAR(128),
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ExpiresAt DATETIME2 NOT NULL
);
```

### 11.9 Rate Limiting & Abuse Protection

- Client-side: throttle sends and typing indicators
- Server-side: middleware that enforces per-user and per-IP limits
- Use Azure API Management, Front Door WAF or a distributed store (Redis) for counters when scaling

Example policy: 30 messages per minute per user; if exceeded return `429` with `Retry-After`.

### 11.10 OpenAPI / Documentation

- Generate OpenAPI/Swagger from controllers using `Swashbuckle.AspNetCore`.
- Publish a human-friendly API explorer at `/swagger` (protected or restricted in production).

### 11.11 Observability

- Log request/response sizes, latencies, and error rates to Application Insights
- Tag logs with `X-Correlation-ID` and user id (where permitted)
- Expose key metrics: `api_requests_total`, `api_errors_total`, `api_latency_seconds`

---

## 12. Performance Considerations

This section outlines practical, actionable performance improvements for frontend, backend and database layers plus testing guidance to validate capacity and identify bottlenecks.

### 12.1 Frontend Performance

- Keep the initial bundle small
  - Use Vite code-splitting and lazy load heavy modules (chat window components, image viewers) with React.lazy + Suspense.
  - Split vendor code and app code; enable long-term caching for vendor bundles.

- Asset optimization
  - Compress and serve images in modern formats (WebP/AVIF). Resize thumbnails server-side.
  - Minify CSS/JS and remove unused CSS with tooling.
  - Use efficient fonts and load them asynchronously.

- Browser caching and CDN
  - Use Azure Front Door caching for static assets. Set strong cache headers for hashed assets (Cache-Control: public, max-age=31536000, immutable).
  - Use short TTL for HTML shell and API responses that change frequently.

- UI rendering
  - Virtualize long message lists (react-window or react-virtualized) to avoid rendering large DOM nodes.
  - Use memoization (React.memo, useMemo) for stable components.

- Network efficiency
  - Batch non-real-time requests where possible (bulk metadata fetch).
  - Debounce typing indicators and avoid sending every keystroke; sample rate e.g., max 1/minute for non-critical signals.

### 12.2 Backend Performance

- Asynchronous, non-blocking I/O
  - Use async/await throughout ASP.NET Core handlers and repository operations to free threads for concurrent requests.

- Connection pooling
  - Rely on ADO.NET default connection pooling. Tune `Max Pool Size` in connection string only if required by high concurrency tests.
  - Example connection string fragment:
    - `Max Pool Size=200;Min Pool Size=5;` (tune after load testing)

- Efficient data access
  - Use projection queries (select only necessary fields) instead of loading full entities for lists.
  - Prefer keyset (cursor) pagination for message history instead of OFFSET/FETCH for large offsets.
  - Use compiled EF Core queries for hot paths.

- Caching
  - Use Azure Cache for Redis for hot lookups: user profiles, thread list, presence short-term state, unread counters.
  - Cache invalidation: update or evict cache entries when backend writes occur to maintain correctness.

- Throttling and backpressure
  - Enforce rate limits and return 429 for abusive clients. Implement server-side queues and circuit breakers for downstream (DB, Key Vault, ACS) faults.
  - Consider Polly for retry policies and circuit breaker patterns in outgoing calls.

- Message batching
  - For heavy inbound operations (bulk export, archival), batch DB writes using table-valued parameters or bulk copy (SqlBulkCopy) to reduce round-trips.

### 12.3 Database Performance

- Index strategy
  - Ensure indexes exist for frequent predicates and ordering (e.g., ChatThreadId + SentAt, ChatThreads.LastMessageAt).
  - Monitor missing index DMVs and address high-cost scans.

- Query tuning
  - Use execution plans to find expensive queries; avoid large table scans by adding appropriate filters and indexes.
  - Avoid scalar or row-by-row operations in hot transactions.

- Read scale
  - For read-heavy workloads, evaluate Azure SQL read replicas or Hyperscale read-only endpoints. Alternatively, use a caching layer (Redis) to offload reads.

- Partitioning & archiving
  - Implement partitioned tables or horizontal sharding for very large message stores. Archive older partitions to Blob storage to keep hot tables small.

- Connection and transaction tuning
  - Keep transactions short; avoid long-running transactions that hold locks.
  - Use proper isolation level (default Read Committed) and consider row versioning (Read Committed Snapshot) to reduce blocking.

### 12.4 Real-time (ACS) Performance

- Minimize payloads
  - Send minimal event payloads for typing/presence events. Only include full content for message events.

- Concurrency
  - ACS handles fan-out; client SDKs should avoid reconnect storms using jittered backoff.

- Fan-out optimization
  - Use ACS for delivery; the backend should avoid becoming a proxy for every message. Persist asynchronously via webhooks.

### 12.5 Load Testing & Capacity Planning

Plan load tests that mimic real usage patterns:
- Scenarios
  1. Steady-state: N concurrent connected users exchanging occasional messages
  2. Spike: sudden burst of messages to a subset of hot threads
  3. Recovery: reconnect storms after an outage
  4. Historical queries: mass history loads (pagination)

- Tools
  - k6 (JavaScript-based), Locust (Python), JMeter. For real-time tests consider writing a small Node script that uses ACS SDK to open many client connections.

- Key metrics to capture
  - 95th / 99th percentile latency for message send and retrieval
  - Messages per second (ingest and delivery)
  - CPU / memory on backend containers and SQL DTU / vCore usage
  - ACS SDK connection count and error rates

- Test data
  - Use representative message sizes and distribution of hot vs cold threads; seed DB with realistic history volumes for accurate performance characterization.

### 12.6 Observability & Alerts for Performance

- Track and alert on:
  - High 95th/99th percentile API latency (e.g., > 1s for message send)
  - Elevated DB CPU or DTU usage for sustained periods
  - Sudden increase in failed ACS connections or webhook errors
  - Redis cache hit ratio dropping below target (e.g., < 80%)

- Dashboards
  - API latency and request rate
  - Messages ingested/delivered per second
  - DB growth and slow queries
  - Queue lengths (webhook processing, archival jobs)

### 12.7 Practical Tuning Checklist

Frontend
- Implement code-splitting and asset hashing
- Use virtualized message lists and image optimizations

Backend
- Use async I/O, compiled queries for hot paths
- Add Redis for hot caches (thread lists, unread counts)
- Tune DB pool sizes only after load tests

Database
- Ensure appropriate indexes and use keyset pagination
- Set up archival and partitioning for older messages

Load Testing
- Run capacity tests before production releases and after schema or query changes

---

## 13. Monitoring and Logging

This section documents the observability strategy for SimpleChat: structured logging, tracing, metrics, dashboards, and alerts to detect, triage and resolve issues quickly.

### 13.1 Goals

- Provide actionable telemetry for production incidents
- Correlate traces across frontend, backend, webhook handlers and background jobs
- Keep operational costs reasonable with sampling and retention policies
- Ensure logging is secure and does not leak PII

### 13.2 Telemetry Components

- Metrics: counts, rates, latencies (Prometheus-style metrics surfaced via Application Insights / Azure Monitor)
- Logs: structured JSON logs (Serilog on backend, console + file for local dev, browser logs for frontend)
- Traces: distributed traces (OpenTelemetry) to follow request flows end-to-end
- Alerts & Dashboards: Application Insights + Azure Monitor Workbooks for visualizations and alerting

### 13.3 Backend Logging (Serilog)

Recommended Serilog setup (appsettings.json snippet):

```json
"Serilog": {
  "Using": [ "Serilog.Sinks.Console", "Serilog.Sinks.ApplicationInsights" ],
  "MinimumLevel": {
    "Default": "Information",
    "Override": {
      "Microsoft": "Warning",
      "System": "Warning"
    }
  },
  "WriteTo": [
    { "Name": "Console" },
    { "Name": "ApplicationInsights", "Args": { "instrumentationKey": "<ikey>" } }
  ],
  "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ]
}
```

Best practices:
- Use structured logging (avoid string concatenation). Example: `_logger.LogInformation("User {UserId} sent message {MessageId}", userId, messageId);`
- Enrich logs with contextual properties: `CorrelationId`, `UserId` (when authorized), `ThreadId`.
- Avoid logging sensitive data (PII, secrets). If necessary, mask or hash values before logging.
- Use Serilog sinks to route logs to Application Insights and, optionally, to a central storage (Log Analytics / blob) for long-term archival.

### 13.4 Distributed Tracing

- Instrument backend services with OpenTelemetry (.NET) and forward traces to Application Insights via the OTLP exporter.
- Propagate trace context from frontend to backend using `traceparent` headers (W3C Trace Context). Include trace/correlation id in logs.
- Sample setup:
  - Use OpenTelemetry SDK to instrument ASP.NET Core requests, outgoing HTTP calls, and critical background jobs.
  - Sample telemetry: `Request`, `Dependency` (SQL, HTTP), `CustomEvent` (ACS webhook processed)

### 13.5 Frontend Instrumentation

- Capture key UX metrics: Time to Interactive, First Contentful Paint, API roundtrip times for message send/load.
- Use Application Insights JavaScript SDK to send traces and custom events from the browser. Enrich traces with `X-Correlation-ID` where available.
- Log client-side errors (unhandled exceptions) and report them with user context (non-PII) to Application Insights.

Frontend example (init):
```ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
const appInsights = new ApplicationInsights({ config: { instrumentationKey: '<ikey>' } });
appInsights.loadAppInsights();
appInsights.trackPageView();
```

### 13.6 Metrics & Dashboards

Key metrics to emit and monitor:
- API request rate (per endpoint)
- API error rate (4xx/5xx)
- 95th/99th percentile latencies for critical endpoints (send message, load messages)
- Messages ingested per second (ACS webhook to DB)
- Webhook processing queue length and retry counts
- ACS connection error rate (per region)
- Redis cache hit ratio and latency

Suggested dashboards:
- Overview: CPU/memory, API rate, error rate, DB DTU/vCore, ACS errors
- Realtime messaging: messages/sec, delivery latency, webhook lag
- Health: response code distributions, top slow queries, queue lengths

Create Azure Monitor Workbooks with visualizations for these metrics and wire them into incident runbooks.

### 13.7 Alerts and Alerting Policies

Examples of useful alerts (start conservative to avoid noise):
- High error rate: `api_errors_total` > X% for 5 minutes → Severity 2
- High latency: 95th percentile send-message latency > 1s for 5 minutes → Severity 2
- Webhook backlog: `webhook_queue_length` > threshold → Severity 1 (blocks persistence)
- DB CPU high: sustained > 80% for 10 minutes → Severity 1
- ACS connection error spike: sudden increase in ACS connect failures → Severity 1

Alert actions:
- Send to PagerDuty or Ops teams via Action Groups
- Automatically create incident tickets with correlation id and recent logs attached

### 13.8 Log Retention & Sampling

- Keep verbose debug logs only in staging or during active incident investigations.
- Production: set default retention to 30 days for full logs and 90–365 days for aggregated metrics depending on compliance and cost.
- Use adaptive sampling in Application Insights to reduce telemetry volume while preserving representative traces. Configure server-side sampling and consider tail-based sampling to preserve error traces.

### 13.9 Webhook & Background Job Observability

- Instrument webhook handlers with metrics: `webhook_received_total`, `webhook_processed_total`, `webhook_processing_errors`.
- Use durable queues (Service Bus / Storage Queue) and monitor dead-letter counts. Add alerts for increased dead-letter items.

### 13.10 Operational Playbooks

- Include short playbooks for common incidents:
  - High message latency: check ACS region status, check webhook backlog, check DB CPU and blocking queries
  - Failed ACS token generation: check Key Vault availability, managed identity assignment
  - Production deploy failure: roll back Front Door origin to previous deployment, run smoke tests

### 13.11 Cost Control

- Monitor telemetry ingestion cost. Use sampling and log level controls to keep monthly costs predictable.
- Archive raw logs to Blob Storage if long-term retention is required but expensive in Log Analytics.

### 13.12 GDPR & Privacy Considerations

- Avoid storing personal data in logs (emails, full message content) unless required and approved. If storing, ensure encryption and restricted access.
- Provide mechanisms to redact or delete logs that contain PII when required by retention policies.

---
 
## 14. Scalability

This final section explains how SimpleChat can scale from a proof-of-concept to a production-grade, globally distributed service. It covers horizontal scaling, state management, partitioning/sharding strategies, autoscaling options, and operational considerations for growth.

### 14.1 Scalability Goals

- Maintain low latency for real-time messages (<100ms delivery where possible)
- Support a growing number of concurrent connected users and threads
- Keep datastore performance predictable as the message corpus grows
- Allow safe, incremental migrations to more capable infrastructure (AKS, Hyperscale)

### 14.2 Stateless Services & Design for Scale

- Keep backend API containers stateless: no in-memory session state that prevents horizontal scaling.
- Use external stores for any state:
  - Redis for ephemeral session/presence/unread counters
  - Azure SQL for durable metadata and message pointers
  - Blob storage for archived messages and attachments
- Design services so any instance can handle any request (no sticky routing required). If session affinity is used later, it should be a performance optimization only.

### 14.3 Real-time Connections & ACS

- ACS handles the connection fan-out and messaging traffic; the backend is not in the happy path for message delivery. This reduces backend scaling pressure.
- Scale ACS resources (and consider multi-region ACS deployments) for geographic distribution and lower latency where supported.

### 14.4 Database Partitioning & Sharding Strategies

- Partitioning by time: partition Messages by SentAt (range partitioning) to simplify archival. Good for retention/archival workloads.
- Partitioning by thread: hash ChatThreadId to a set of partitions (or shards) to spread hot-thread load across compute/storage.
- Sharding when necessary:
  - Use a gateway routing layer (small service or routing table) that maps ChatThreadId -> DB shard connection string.
  - Keep routing logic deterministic (consistent hashing) and store shard map in a central, highly-available store (e.g., Redis or a small config DB).
- Use Azure SQL Hyperscale or move cold data into a separate analytical store if the write/read patterns or dataset size outgrow single-instance capabilities.

### 14.5 Caching & Read Scaling

- Cache hot reads: thread lists, recent messages (most recent page), user profiles and presence using Redis.
- Use cache-aside pattern: read from cache first, fall back to DB on miss, write-through/evict on updates.
- For global scale, consider geo-replicated caches (or per-region caches) to lower latencies.

### 14.6 Autoscaling Options & Migration Path

- Short-term: ACI provides quick, low-management hosting but limited autoscaling capabilities.
- Mid-term: Move to Azure Kubernetes Service (AKS) for better orchestration (horizontal pod autoscaling), rolling updates, and advanced networking.
  - Use KEDA (Kubernetes Event-driven Autoscaling) to autoscale based on queue length (webhook processing), CPU, or custom metrics.
  - Use the Kubernetes HorizontalPodAutoscaler (HPA) for CPU/memory-based scaling, and KEDA ScaledObjects for message-driven scaling.
- Long-term: Consider a microservices split (separate services for auth, threads, message persistence, webhook processors) and use multiple AKS clusters per region for multiregion failover.

### 14.7 Handling Hot Threads & Load Balancing

- Hot-thread problem: some chat threads (e.g., group broadcasts) may receive disproportionate traffic.
- Mitigation:
  - Fan-out via ACS which is optimized for many recipients.
  - Rate-limit per thread and per user at the API layer.
  - Offload archival/analytics to background jobs to avoid blocking hot paths.
  - If a single thread's DB writes become too heavy, shard message storage by thread hash so the hot thread lands on a less-loaded shard.

### 14.8 Consistency, Ordering and Cross-Shard Operations

- Keep per-thread ordering guarantees by ensuring that all messages for a thread are persisted to the same shard or partition.
- Cross-thread / cross-shard queries (e.g., global search) should be implemented as background analytics jobs that aggregate into a search index (ElasticSearch, Azure Cognitive Search).

### 14.9 Distributed Coordination

- Use Redis-based distributed locks (RedLock) or a leader election pattern when you need a single instance to perform specific tasks (e.g., run archival job for a partition).
- Prefer idempotent background jobs and at-least-once processing with dead-letter handling rather than strict distributed transactions across services.

### 14.10 Multi-region & Geo-Distribution

- If global low-latency is a requirement:
  - Deploy frontend and ACS usage per-region close to users.
  - Use regional AKS clusters with geo-aware Front Door routing.
  - Keep user metadata in a central authoritative DB or use per-region user profiles with conflict resolution strategy.
  - For messages, a single-region write model is simpler (writes land in primary region), with cross-region replication for read-only replicas or asynchronous replication.

### 14.11 Operational Considerations

- Capacity planning: simulate expected growth with load tests and monitor resource consumption (CPU, memory, DB DTU/vCore, ACS quotas).
- Runbook operations: include procedures for scaling up (increase vCores/replicas) and scaling out (add shards, AKS node pools).

### 14.12 Migration Checklist (ACI → AKS)

1. Containerize all components and verify health probes and readiness/liveness endpoints.
2. Introduce Helm charts or Kubernetes manifests & CI for kubectl/helm deployments.
3. Configure HPA and KEDA for autoscaling; test scaling with load tests.
4. Move background job processors to Kubernetes with durable queues (Service Bus / Storage Queue) as the scaling driver.
5. Migrate DNS/Front Door origin gradually (canary) and monitor telemetry.

### 14.13 Future-Proofing Suggestions

- Design for eventual service decomposition: separate responsibilities into focused services rather than a single monolith.
- Keep APIs backwards compatible and versioned to allow rolling upgrades.
- Standardize observability and CI/CD so each service has consistent monitoring, tests and deploy pipelines.

---

