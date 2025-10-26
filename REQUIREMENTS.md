# Simple Chat & Call Application - Requirements Document

## Project Overview
# Simple 1-on-1 Chat Application - Requirements Document

## Project Overview
A simplified real-time messaging application for one-on-one conversations, built with React (frontend) and C# .NET (backend), leveraging Azure Communication Services for chat features and Microsoft Entra ID for authentication.

**Scope**: Basic two-person chat with text messaging only. No group chats, no calling, no video features.

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Context API
- **UI Library**: Material-UI (MUI) or Tailwind CSS
- **Azure SDKs**:
  - @azure/communication-chat (v1.x)
  - @azure/communication-common
  - @azure/msal-react (Entra ID authentication)

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Database**: Azure SQL Database / PostgreSQL
- **ORM**: Entity Framework Core
- **Authentication**: Microsoft Entra ID (formerly Azure AD)
- **Azure SDKs**:
  - Azure.Communication.Identity
  - Azure.Communication.Chat
  - Microsoft.Identity.Web (Entra ID authentication)

### Infrastructure
- **Hosting**: Azure App Service (Backend) + Azure Static Web Apps (Frontend)
- **Monitoring**: Application Insights

---

## Functional Requirements

### 1. User Management

#### 1.1 User Registration & Authentication
- **FR-1.1.1**: Users can sign up using Microsoft Entra ID (work/school accounts or personal Microsoft accounts)
- **FR-1.1.2**: Users can log in using Microsoft Entra ID OAuth 2.0 / OpenID Connect
- **FR-1.1.3**: Users can log out from the application
- **FR-1.1.4**: System generates Azure Communication Services identity upon first user login
- **FR-1.1.5**: System provides JWT access token from Entra ID for authenticated sessions
- **FR-1.1.6**: System uses Entra ID for password management and security (MFA support)
- **FR-1.1.7**: Users can authenticate using single sign-on (SSO) if configured

#### 1.2 User Profile
- **FR-1.2.1**: Users can set/update their display name
- **FR-1.2.2**: Users can upload/update profile picture
- **FR-1.2.3**: Users can view their own profile
- **FR-1.2.4**: Users can view other users' profiles (name and picture only)

#### 1.3 User Presence
- **FR-1.3.1**: System tracks user online/offline status
- **FR-1.3.2**: Other users can see presence status in real-time
- **FR-1.3.3**: System automatically sets status to "Offline" when user disconnects

---

### 2. Chat Features

#### 2.1 One-on-One Chat
- **FR-2.1.1**: Users can search for other users by name/email
- **FR-2.1.2**: Users can start a direct chat with another user
- **FR-2.1.3**: Users can send text messages in real-time
- **FR-2.1.4**: Messages are delivered instantly to online recipients
- **FR-2.1.5**: Messages are stored and delivered when offline users come online
- **FR-2.1.6**: Users can see typing indicators when the other person is typing
- **FR-2.1.7**: Messages display timestamp (sent time)
- **FR-2.1.8**: Users can scroll through message history (pagination)

#### 2.2 Message Features
- **FR-2.2.1**: Users can send text messages (max 8000 characters)
- **FR-2.2.2**: Users can send emojis
- **FR-2.2.3**: Messages show sender name and avatar
- **FR-2.2.4**: Users can copy message text

#### 2.3 Read Receipts
- **FR-2.3.1**: System tracks message read status
- **FR-2.3.2**: Users see indicators for message delivery and read status
- **FR-2.3.3**: Single check: message sent
- **FR-2.3.4**: Double check: message delivered
- **FR-2.3.5**: Blue double check: message read

---

### 3. Notifications

#### 3.1 In-App Notifications
- **FR-3.1.1**: Users see unread message count badge on chat list
- **FR-3.1.2**: Users see notification banner for new messages
- **FR-3.1.3**: Chat list shows preview of last message
- **FR-3.1.4**: Unread chats are highlighted/bolded in chat list

---

### 4. User Interface

#### 4.1 Chat List View
- **FR-4.1.1**: Display list of all conversations (recent first)
- **FR-4.1.2**: Show last message preview and timestamp
- **FR-4.1.3**: Display unread message count badge
- **FR-4.1.4**: Show user avatar
- **FR-4.1.5**: Display online status indicator for users
- **FR-4.1.6**: Search/filter conversations

#### 4.2 Chat Window
- **FR-4.2.1**: Display conversation header with name and status
- **FR-4.2.2**: Show message history with scroll (load older messages)
- **FR-4.2.3**: Display message input field with send button
- **FR-4.2.4**: Show typing indicator
- **FR-4.2.5**: Emoji picker button

#### 4.3 Responsive Design
- **FR-4.3.1**: Application works on desktop browsers (Chrome, Firefox, Safari, Edge)
- **FR-4.3.2**: Application is responsive for tablet screens
- **FR-4.3.3**: Application is responsive for mobile screens
- **FR-4.3.4**: Touch-friendly controls on mobile devices

---

## Non-Functional Requirements

### 6. Performance

- **NFR-6.1**: Messages must be delivered within 500ms for online users
- **NFR-6.2**: Application must load within 3 seconds on standard internet connection
- **NFR-6.3**: Chat history must load 50 messages per page
- **NFR-6.4**: API response time must be under 200ms for 95% of requests
- **NFR-6.5**: System must support 100 concurrent users initially (MVP)
- **NFR-6.6**: Database queries must execute within 100ms

### 7. Security

- **NFR-7.1**: All API communications must use HTTPS/TLS 1.3
- **NFR-7.2**: Use Microsoft Entra ID for authentication (OAuth 2.0 / OpenID Connect)
- **NFR-7.3**: Entra ID access tokens must be validated on every API request
- **NFR-7.4**: JWT tokens follow Entra ID token lifetime policies (default 1 hour)
- **NFR-7.5**: Refresh tokens managed by Entra ID (default 90 days, sliding window)
- **NFR-7.6**: Implement rate limiting on API endpoints (100 requests/minute per user)
- **NFR-7.7**: Validate and sanitize all user inputs
- **NFR-7.8**: Implement CORS policies for frontend domain (whitelist only)
- **NFR-7.9**: File uploads must be scanned for malware
- **NFR-7.10**: Implement SQL injection prevention using parameterized queries
- **NFR-7.11**: Store ACS access tokens securely (encrypted at rest)
- **NFR-7.12**: Support Entra ID Conditional Access policies
- **NFR-7.13**: Enable Multi-Factor Authentication (MFA) through Entra ID

### 8. Reliability & Availability

- **NFR-8.1**: System uptime must be 99.5% or higher
- **NFR-8.2**: Implement automatic reconnection for dropped connections
- **NFR-8.3**: Graceful degradation when ACS services are unavailable
- **NFR-8.4**: Message queue for offline message delivery
- **NFR-8.5**: Automatic retry mechanism for failed API calls (max 3 retries)
- **NFR-8.6**: Error logging and monitoring with Application Insights
- **NFR-8.7**: Database backup every 24 hours

### 9. Scalability

- **NFR-9.1**: Architecture must support horizontal scaling
- **NFR-9.2**: Stateless API design for load balancing
- **NFR-9.3**: Use connection pooling for database connections
- **NFR-9.4**: Design to support 1,000+ concurrent users with infrastructure scaling

### 10. Usability

- **NFR-10.1**: Intuitive user interface following modern design patterns
- **NFR-10.2**: Consistent design language across all screens
- **NFR-10.3**: Accessibility compliance (WCAG 2.1 Level AA)
- **NFR-10.4**: Support for keyboard navigation
- **NFR-10.5**: Error messages must be user-friendly and actionable
- **NFR-10.6**: Loading states for all async operations
- **NFR-10.7**: Maximum 3 clicks to reach any feature

### 11. Maintainability

- **NFR-11.1**: Code must follow language-specific style guides (ESLint for React, StyleCop for C#)
- **NFR-11.2**: Minimum 70% code coverage for unit tests
- **NFR-11.3**: Comprehensive API documentation (Swagger/OpenAPI)
- **NFR-11.4**: Detailed inline code comments for complex logic
- **NFR-11.5**: Structured logging with different log levels
- **NFR-11.6**: Environment-based configuration management
- **NFR-11.7**: Version control with meaningful commit messages

---

## Technical Architecture

### 12. System Components

#### 12.1 Frontend (React)
- **Single Page Application** (SPA)
- **Authentication**: Microsoft Authentication Library (MSAL) for React (@azure/msal-react)
- **Component Structure**:
  - Authentication components (Login with Microsoft, Protected Routes)
  - Chat components (ChatList, ChatWindow, MessageBubble)
  - User components (UserProfile, UserSearch)
  - Shared components (Header, Notifications)
- **State Management**: Context API for global state
- **Routing**: React Router for navigation
- **Real-time**: ACS Chat SDK for real-time messaging

#### 12.2 Backend (C# .NET)
- **RESTful API** architecture
- **Authentication**: Microsoft.Identity.Web for Entra ID token validation
- **Authorization**: Role-based authorization
- **Controllers**:
  - AuthController (Entra ID token exchange, ACS token generation)
  - UserController (profile, search, presence)
  - ChatController (create chat, get messages, send message)
- **Services**:
  - EntraIdService (user info from Microsoft Graph API)
  - AzureCommunicationService (ACS token generation, identity management)
  - ChatService (business logic for messaging)
  - UserService (user management)
  - NotificationService (real-time events)
- **Repository Pattern** for data access
- **Dependency Injection** for loose coupling

#### 12.3 Database Schema
- **Users Table**:
  - UserId (PK), EntraIdObjectId (unique), Email, DisplayName, AvatarUrl, AcsIdentity, CreatedAt, LastSeen
- **Conversations Table**:
  - ConversationId (PK), AcsChatThreadId, CreatedAt, CreatedBy
- **Participants Table**:
  - ParticipantId (PK), ConversationId (FK), UserId (FK), JoinedAt
- **Messages Table**:
  - MessageId (PK), ConversationId (FK), AcsMessageId, SenderId (FK), Content, SentAt
- **MessageReceipts Table**:
  - ReceiptId (PK), MessageId (FK), UserId (FK), ReadAt
- **UserPresence Table**:
  - PresenceId (PK), UserId (FK), IsOnline, LastUpdated

#### 12.4 Azure Communication Services Integration
- **Identity Management**: Generate ACS user identities for each app user
- **Access Tokens**: Issue ACS access tokens with scopes (chat, voip)
- **Chat SDK**: Use ACS Chat SDK for thread management
- **Calling SDK**: Use ACS Calling SDK for voice/video calls
- **Token Refresh**: Implement token refresh before expiration

---

## API Endpoints

### 13. Authentication APIs
- `POST /api/auth/initialize` - Initialize user in app database on first login (auto-triggered)
- `GET /api/auth/me` - Get current authenticated user from Entra ID token
- `GET /api/auth/acs-token` - Get ACS access token for the authenticated user
- `POST /api/auth/logout` - User logout (client-side MSAL logout)

### 14. User APIs
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `POST /api/users/me/avatar` - Upload profile picture
- `GET /api/users/search?q={query}` - Search users
- `GET /api/users/{userId}` - Get user by ID
- `GET /api/users/{userId}/presence` - Get user presence

### 15. Chat APIs
- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create new 1-on-1 conversation
- `GET /api/conversations/{conversationId}` - Get conversation details
- `GET /api/conversations/{conversationId}/messages` - Get messages (paginated)
- `POST /api/conversations/{conversationId}/messages` - Send message
- `POST /api/conversations/{conversationId}/read` - Mark messages as read

---

## Development Phases

### Phase 1: Foundation (Week 1)
- Set up development environment
- Create React project with TypeScript
- Create .NET 8 Web API project
- Set up Azure resources (ACS, SQL Database, Entra ID App Registration)
- Configure Microsoft Entra ID authentication
- Implement MSAL for React (frontend authentication)
- Implement Microsoft.Identity.Web (backend token validation)
- Database schema creation

### Phase 2: Core Chat Features (Week 2)
- Implement one-on-one chat functionality
- ACS Chat thread creation
- Message sending and receiving
- Chat history and pagination
- Real-time message delivery using ACS Chat SDK
- Basic UI for chat list and chat window

### Phase 3: Enhanced Features (Week 3)
- Typing indicators
- Read receipts implementation
- User search functionality
- User presence tracking
- Emoji support
- Message timestamps

### Phase 4: Polish & Testing (Week 4)
- UI/UX refinement
- Responsive design
- Error handling and loading states
- Unit testing (frontend and backend)
- Integration testing
- End-to-end testing
- Performance optimization
- Documentation

---

## Testing Requirements

### 18. Testing Strategy

#### 18.1 Unit Tests
- Backend: Test all service methods, controllers, and repositories
- Frontend: Test React components, hooks, and utility functions
- Target: 70% code coverage minimum

#### 18.2 Integration Tests
- API endpoint testing
- Database operations
- ACS service integration
- File upload/download flows

#### 18.3 End-to-End Tests
- User registration and login flow
- Send and receive messages
- User search and conversation creation
- Read receipts functionality

#### 18.4 Performance Tests
- Load testing for concurrent users
- Message throughput testing
- Database query optimization

#### 18.5 Security Tests
- Authentication and authorization testing
- Input validation testing
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## Deployment Requirements

### 21. Deployment Strategy

#### 21.1 Frontend Deployment
- Host on Azure Static Web Apps
- Enable custom domain and SSL
- Configure CDN for static assets
- Set environment variables for API endpoints

#### 21.2 Backend Deployment
- Deploy to Azure App Service (Linux or Windows)
- Configure application settings and connection strings
- Enable Application Insights
- Set up automated deployments from Git repository
- Configure CORS policies

#### 21.3 Database Deployment
- Azure SQL Database or PostgreSQL on Azure
- Configure firewall rules
- Enable automated backups
- Set up connection pooling

#### 21.4 Storage Deployment
- Azure Blob Storage for file attachments
- Configure blob lifecycle policies
- Set appropriate access levels
- Enable CDN for file delivery

---

## Local Development & Testing

### 19. Local Development Setup

#### 19.1 Prerequisites
- **Development Machine Requirements**:
  - Node.js 18+ and npm/yarn
  - .NET 8 SDK
  - Visual Studio Code or Visual Studio 2022
  - Git
  - SQL Server Express (local) or Docker with SQL Server container
  - Azure CLI (for Azure resource management)

#### 19.2 Azure Resources Required (Cloud)
Since Azure Communication Services cannot be fully emulated locally, you need these cloud resources:

- **Azure Communication Services Resource**:
  - Create an ACS resource in Azure Portal
  - Note the connection string from Keys section
  - This will be used for chat functionality
  
- **Microsoft Entra ID App Registration**:
  - Register application in Azure Portal (Azure Active Directory)
  - Configure redirect URIs for localhost:
    - `http://localhost:3000` (React dev server)
    - `http://localhost:3000/redirect` (OAuth callback)
  - Add API permissions: `User.Read` (Microsoft Graph)
  - Create client secret for backend API
  - Note: Application (client) ID, Directory (tenant) ID, and client secret
  
- **Azure SQL Database** (Optional):
  - Use local SQL Server Express or Docker container for development
  - Use Azure SQL Database for staging/production

#### 19.3 Local Development Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Development Machine                    │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  React Frontend  │      │  .NET Web API    │        │
│  │  localhost:3000  │─────▶│  localhost:5001  │        │
│  │                  │      │                  │        │
│  │  - MSAL.js       │      │  - EF Core       │        │
│  │  - ACS Chat SDK  │      │  - ACS SDK       │        │
│  └──────────────────┘      └──────────────────┘        │
│         │                          │                    │
│         │                          │                    │
│         └──────────┬───────────────┘                    │
│                    │                                     │
│         ┌──────────▼──────────┐                         │
│         │  Local SQL Server   │                         │
│         │  localhost:1433     │                         │
│         └─────────────────────┘                         │
└─────────────────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Azure Cloud                          │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │       Microsoft Entra ID (Azure AD)          │      │
│  │  - User Authentication                       │      │
│  │  - Token Issuance                            │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Azure Communication Services               │      │
│  │  - Chat Service                              │      │
│  │  - Identity & Token Management               │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

#### 19.4 Environment Configuration

**Frontend (.env.local)**:
```bash
# React App Environment Variables
REACT_APP_API_BASE_URL=http://localhost:5001
REACT_APP_ENTRA_CLIENT_ID=<your-entra-app-client-id>
REACT_APP_ENTRA_TENANT_ID=<your-entra-tenant-id>
REACT_APP_ENTRA_REDIRECT_URI=http://localhost:3000
REACT_APP_ACS_ENDPOINT=<not-needed-frontend-gets-token-from-backend>
```

**Backend (appsettings.Development.json)**:
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<your-entra-tenant-id>",
    "ClientId": "<your-entra-app-client-id>",
    "ClientSecret": "<your-entra-client-secret>",
    "Audience": "api://<your-entra-app-client-id>"
  },
  "AzureCommunicationServices": {
    "ConnectionString": "<your-acs-connection-string>",
    "Endpoint": "https://<your-acs-resource>.communication.azure.com"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=ChatAppDb;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;"
  },
  "AllowedOrigins": [
    "http://localhost:3000"
  ]
}
```

#### 19.5 Step-by-Step Local Setup

**Step 1: Set Up Azure Resources**
```bash
# Install Azure CLI (if not already installed)
# macOS:
brew install azure-cli

# Login to Azure
az login

# Create Resource Group
az group create --name rg-chatapp-dev --location eastus

# Create Azure Communication Services
az communication create \
  --name acs-chatapp-dev \
  --resource-group rg-chatapp-dev \
  --location global \
  --data-location UnitedStates

# Get ACS connection string
az communication list-key \
  --name acs-chatapp-dev \
  --resource-group rg-chatapp-dev

# Create Storage Account (optional - can use Azurite)
az storage account create \
  --name stchatappdev \
  --resource-group rg-chatapp-dev \
  --location eastus \
  --sku Standard_LRS
```

**Step 2: Configure Entra ID App Registration**
```bash
# Via Azure Portal (https://portal.azure.com):
# 1. Navigate to "Azure Active Directory" > "App registrations"
# 2. Click "New registration"
#    - Name: ChatApp-Local-Dev
#    - Supported account types: "Accounts in this organizational directory only"
#    - Redirect URI: Web > http://localhost:3000
# 3. After creation, note the "Application (client) ID" and "Directory (tenant) ID"
# 4. Go to "Certificates & secrets" > "New client secret"
#    - Description: Local Development
#    - Expires: 24 months
#    - Copy the secret value immediately
# 5. Go to "API permissions" > "Add a permission"
#    - Microsoft Graph > Delegated > User.Read
#    - Click "Grant admin consent"
# 6. Go to "Authentication"
#    - Add additional redirect URIs if needed
#    - Enable "Access tokens" and "ID tokens"
# 7. Go to "Expose an API"
#    - Set Application ID URI: api://<client-id>
#    - Add a scope: access_as_user
```

**Step 3: Set Up Local Database**
```bash
# Option 1: Using Docker (Recommended)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sql-chatapp-dev \
   -d mcr.microsoft.com/mssql/server:2022-latest

# Option 2: Install SQL Server Express
# Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
```

**Step 4: Clone and Setup Backend**
```bash
# Navigate to project directory
cd /Users/gurkan_indibay/source/azure_communications

# Create backend project (if not exists)
dotnet new webapi -n ChatApp.API
cd ChatApp.API

# Install required packages
dotnet add package Microsoft.Identity.Web
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Azure.Communication.Identity
dotnet add package Azure.Communication.Chat

# Update appsettings.Development.json with your values

# Run database migrations
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run the backend
dotnet run
# Backend will run on: https://localhost:5001
```

**Step 5: Setup Frontend**
```bash
# Navigate to frontend directory
cd /Users/gurkan_indibay/source/azure_communications

# Create React app (if not exists)
npx create-react-app chat-app-frontend --template typescript
cd chat-app-frontend

# Install required packages
npm install @azure/msal-react @azure/msal-browser
npm install @azure/communication-chat
npm install @azure/communication-common
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom

# Create .env.local file with your values

# Run the frontend
npm start
# Frontend will run on: http://localhost:3000
```

#### 19.6 Testing Workflow for Local Development

**Test 1: Authentication Flow**
1. Open browser to `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. Authenticate with your Microsoft account (work/school or personal)
4. Verify you're redirected back to the app
5. Check browser DevTools > Application > Local Storage for MSAL tokens
6. Verify backend receives valid token in Authorization header

**Test 2: ACS Token Generation**
1. After login, frontend should request ACS token from backend
2. Backend API endpoint `/api/auth/acs-token` should:
   - Validate Entra ID token
   - Create or retrieve ACS identity for user
   - Generate ACS access token with chat and voip scopes
   - Return token to frontend
3. Verify ACS token in Network tab (DevTools)

**Test 3: Chat Functionality**
1. Open two browser windows (or use Incognito for second user)
2. Sign in with different Microsoft accounts in each window
3. Create a chat conversation
4. Send messages between users
5. Verify real-time message delivery (via ACS Chat SDK)
6. Messages should appear in both windows instantly

**Test 4: Calling Functionality**
1. With two authenticated users (different browsers/windows)
2. Initiate a call from User A to User B
3. Verify call notification appears for User B
4. Accept the call on User B's side
5. Verify audio/video connection (using ACS Calling SDK)
6. Test mute/unmute, camera on/off
7. End call and verify cleanup

**Test 5: File Upload**
1. Send a message with file attachment
2. File should upload to Azure Blob Storage (or Azurite)
3. Recipient should see file and be able to download
4. Verify file is accessible via generated SAS URL

#### 19.7 Debugging Tips

**Frontend Debugging:**
```bash
# Enable verbose MSAL logging
# In your MSAL configuration:
const msalConfig = {
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose
    }
  }
};

# Enable ACS Chat SDK logging
# In your chat client initialization:
const chatClient = new ChatClient(endpoint, credential);
// Monitor events in browser console
```

**Backend Debugging:**
```bash
# Enable detailed logging in appsettings.Development.json
"Logging": {
  "LogLevel": {
    "Default": "Debug",
    "Microsoft.AspNetCore": "Debug",
    "Microsoft.EntityFrameworkCore": "Information",
    "Azure.Communication": "Debug"
  }
}

# Use Visual Studio or VS Code debugger
# Set breakpoints in:
# - AuthController (token validation)
# - AzureCommunicationService (ACS token generation)
# - ChatController (message handling)

# Run with debugger attached
dotnet run --launch-profile https
```

**Common Issues and Solutions:**

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to `AllowedOrigins` in backend config |
| Entra ID redirect fails | Verify redirect URI matches exactly in App Registration |
| ACS token invalid | Check ACS connection string and ensure resource is active |
| Database connection fails | Verify SQL Server is running and connection string is correct |
| Chat messages not delivered | Check ACS endpoint URL and ensure chat service is enabled |
| Token expired errors | Implement token refresh logic in frontend |

#### 19.8 Multi-User Testing Scenarios

**Option 1: Multiple Browser Profiles**
- Use Chrome profiles to sign in as different users
- Create multiple Microsoft accounts for testing
- Each profile maintains separate auth state

**Option 2: Multiple Browsers**
- Chrome, Firefox, Safari, Edge
- Sign in with different accounts in each
- Test cross-browser compatibility

**Option 3: Incognito/Private Windows**
- Use regular + incognito windows
- Sign in with different accounts
- Quick way to test 2-user scenarios

**Option 4: Multiple Machines (Ideal)**
- Test on different devices (laptop, desktop, tablet)
- Real-world network conditions
- Better simulation of production environment

#### 19.9 Local Development Limitations

**What Works Locally:**
✅ Authentication via Entra ID (redirects to Microsoft login)
✅ Backend API development and testing
✅ Database operations (using local SQL Server)
✅ ACS Chat functionality (connects to Azure ACS)
✅ Frontend UI development
✅ End-to-end user flows

**What Requires Azure (Cannot be Fully Local):**
❌ Microsoft Entra ID authentication (requires Azure AD tenant)
❌ Azure Communication Services (no local emulator available)

**Costs for Local Development:**
- **ACS**: Pay-as-you-go (very cheap for development)
  - Chat: ~$0.0015 per message
  - Expected monthly cost: < $2 for solo development
- **Entra ID**: Free for basic features
- **SQL Database**: Local (free) or Azure Basic tier (~$5/month)

**Recommendation**: Use Azure resources even for local dev since costs are minimal and you get production-like environment.

---

## Documentation Requirements

### 20. Documentation Deliverables

#### 20.1 Technical Documentation
- Architecture overview diagram
- Database schema documentation
- API documentation (Swagger/OpenAPI)
- Deployment guide
- Configuration guide

#### 20.2 User Documentation
- User guide/manual
- FAQ section
- Troubleshooting guide

#### 20.3 Developer Documentation
- Setup and installation guide
- Coding standards and conventions
- Contributing guidelines
- README files for each component

---

## Success Criteria

### 22. Project Success Metrics

- ✅ All functional requirements implemented and tested
- ✅ Application deployed and accessible via public URL
- ✅ Users can successfully authenticate with Entra ID
- ✅ Users can search for other users and start conversations
- ✅ Users can send and receive messages in real-time
- ✅ Message delivery time < 500ms
- ✅ Read receipts working correctly
- ✅ Zero critical security vulnerabilities
- ✅ 70%+ code coverage for tests
- ✅ Application Insights monitoring active
- ✅ Complete documentation delivered

---

## Constraints & Assumptions

### 23. Project Constraints
- Must use Azure Communication Services for chat features
- Must use React for frontend and C# .NET for backend
- Must deploy on Azure infrastructure
- Budget constraints for Azure resources (use basic tiers)
- Development timeline: 4 weeks for MVP
- Chat only - no calling or video features

### 24. Assumptions
- Users have modern browsers with WebRTC support
- Users have stable internet connection (minimum 512 Kbps)
- Azure Communication Services is available in user's region
- Users have a Microsoft account (personal, work, or school) or organization uses Entra ID
- Entra ID tenant is properly configured with required permissions

---

## Future Enhancements (Out of Scope for MVP)

### 25. Post-MVP Features (Out of Scope)
- Group chat functionality
- Voice and video calling
- File attachments and image sharing
- Message editing and deletion
- Message search functionality
- Voice messages
- Location sharing
- Contact synchronization
- Message reactions (likes, emojis)
- Screen sharing during calls
- Call recording
- Broadcast channels
- Bot integration
- End-to-end encryption
- Multi-language support
- Dark mode theme
- Desktop notifications
- Mobile apps (iOS/Android)
- Advanced analytics dashboard
- Admin panel for user management

---

## Risks & Mitigation

### 26. Project Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| ACS service limits exceeded | High | Low | Implement rate limiting, monitor usage |
| Data security breach | High | Low | Follow security best practices, regular audits, encryption |
| Performance degradation with scale | Medium | Medium | Implement caching, optimize queries |
| Third-party SDK breaking changes | Medium | Low | Pin SDK versions, monitor release notes, test updates |
| Budget overrun for Azure services | Low | Low | Monitor costs daily, use alerts, optimize resource usage |

---

## Glossary

- **ACS**: Azure Communication Services
- **JWT**: JSON Web Token
- **SPA**: Single Page Application
- **WebRTC**: Web Real-Time Communication
- **CORS**: Cross-Origin Resource Sharing
- **CI/CD**: Continuous Integration/Continuous Deployment
- **MVP**: Minimum Viable Product
- **ORM**: Object-Relational Mapping
- **REST**: Representational State Transfer
- **TLS**: Transport Layer Security
