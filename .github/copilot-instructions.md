# Simple Chat Application - Copilot Instructions

## Project Overview
This is a real-time 1-on-1 chat application built with React, ASP.NET Core, and Azure Communication Services. The application enables authenticated users to have real-time text conversations using Microsoft Entra ID authentication.

## Technology Stack
- **Frontend**: React 18+ with TypeScript, Material-UI, Vite
- **Backend**: ASP.NET Core 8.0 Web API with C#
- **Database**: SQL Server (local via Docker, Azure SQL in production)
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Real-time Chat**: Azure Communication Services (ACS)
- **Deployment**: Docker, Azure Container Instances, Azure Front Door

## Project Structure
```
azure_communications/
├── src/
│   ├── backend/                    # ASP.NET Core Web API
│   │   ├── SimpleChat.API/         # Web API controllers & startup
│   │   ├── SimpleChat.Core/        # Domain entities & interfaces
│   │   ├── SimpleChat.Application/ # Business logic & DTOs
│   │   └── SimpleChat.Infrastructure/ # EF Core, repositories, services
│   └── frontend/                   # React + TypeScript application
│       ├── src/
│       │   ├── components/         # React components
│       │   ├── hooks/             # Custom React hooks
│       │   ├── services/          # API clients & ACS integration
│       │   ├── contexts/          # React contexts (Auth, etc.)
│       │   ├── types/             # TypeScript type definitions
│       │   └── pages/             # Page components
│       ├── public/                # Static assets
│       └── nginx.conf             # Nginx configuration for production
├── database/
│   └── init/                      # SQL initialization scripts
├── docs/                          # Documentation files
├── docker-compose.yml             # Local SQL Server setup
├── requirements.txt               # Python dependencies
└── *.sh                           # Development scripts
```

## Development Workflow

### Using dev.sh (Development Environment Manager)
The `dev.sh` script is the primary tool for managing the local development environment. It provides a unified interface for controlling all services.

**Common Commands:**
```bash
# Start all services (database, backend, frontend)
./dev.sh start all

# Start individual services
./dev.sh start database    # Start SQL Server container
./dev.sh start backend     # Start ASP.NET Core API
./dev.sh start frontend    # Start React development server

# Check status of all services
./dev.sh status

# Restart services
./dev.sh restart frontend  # Restart React dev server
./dev.sh restart backend   # Restart API server
./dev.sh restart all       # Restart everything

# Stop services
./dev.sh stop all          # Stop all services gracefully
./dev.sh kill all          # Force kill all service processes
```

**Service URLs when running:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000 (HTTP) / https://localhost:7001 (HTTPS)
- Database: localhost:1433 (SQL Server)

### Using run_sql.py (Database Query Tool)
The `run_sql.py` script allows you to execute arbitrary SQL queries against the local SQL Server database.

**Usage Examples:**
```bash
# Execute SQL from command line
python run_sql.py "SELECT * FROM Users"

# Execute SQL from file
python run_sql.py -f database/init/01-create-database.sql

# Execute SQL from stdin
echo "SELECT name FROM sys.databases;" | python run_sql.py -

# Custom connection parameters
python run_sql.py --server 127.0.0.1 --port 1433 --database SimpleChatDB --user sa --password YourStrong@Passw0rd "SELECT * FROM Users"
```

**Features:**
- Automatic dependency installation (pymssql)
- Formatted table output
- Support for multiple result sets
- Environment variable configuration
- Error handling and connection validation

## Architecture Principles

### Direct ACS Messaging Architecture
- **Frontend sends messages directly to ACS** (not through backend API)
- **Backend handles metadata only** (user management, thread creation, message persistence)
- **Real-time events flow**: ACS → Frontend (via SDK events)
- **Backend receives messages via ACS Event Grid webhooks** for persistence

### Key Design Decisions
1. **Real-time messaging bypasses backend** for low latency (< 100ms)
2. **Backend serves as metadata API** for user/thread management
3. **Database stores message history** for persistence and search
4. **ACS handles real-time delivery** and presence indicators

## Development Guidelines

### Frontend Development
- Use TypeScript for all new code
- Follow React hooks patterns
- Use Material-UI components for consistency
- Implement proper error boundaries
- Use React Context for global state (Auth, etc.)
- Follow the custom hooks pattern for ACS integration

### Backend Development
- Follow Clean Architecture principles
- Use dependency injection throughout
- Implement repository pattern for data access
- Use DTOs for API communication
- Implement proper logging with Serilog
- Use async/await consistently

### Database Development
- Use Entity Framework Core migrations
- Follow database-first approach for schema changes
- Use SQL Server specific features when beneficial
- Implement proper indexing for performance
- Use transactions for data consistency

## Common Development Tasks

### Adding a New API Endpoint
1. Create DTOs in `SimpleChat.Application/DTOs/`
2. Add interface method in appropriate service interface
3. Implement business logic in service class
4. Add controller method with proper routing
5. Update OpenAPI documentation

### Adding a New Frontend Component
1. Create component in `src/components/`
2. Add TypeScript interfaces in `src/types/`
3. Implement using React hooks
4. Add proper error handling
5. Use Material-UI for styling consistency

### Database Schema Changes
1. Modify entities in `SimpleChat.Core/Entities/`
2. Update DbContext configurations
3. Create new migration: `dotnet ef migrations add MigrationName`
4. Apply migration: `dotnet ef database update`
5. Test with local database using `run_sql.py`

### ACS Integration
- Use the ACS Chat SDK for real-time messaging
- Handle connection lifecycle properly
- Implement proper error handling for network issues
- Use ACS user identities for message attribution

## Environment Setup

### Local Development
1. **Start services**: `./dev.sh start all`
2. **Database**: Automatically created via Docker Compose
3. **Migrations**: Applied automatically on first run
4. **Environment variables**: Configure in `.env.local`

### Azure Configuration Required
- **Azure Communication Services** resource
- **Microsoft Entra ID** app registration
- **Azure SQL Database** (for production)
- **Azure Container Registry** (for deployment)

## Testing Strategy

### Unit Tests
- Backend: xUnit with Moq for mocking
- Frontend: Jest with React Testing Library
- Focus on business logic and component behavior

### Integration Tests
- API endpoint testing with test database
- ACS integration testing
- Authentication flow testing

### End-to-End Tests
- User registration and login
- Real-time messaging between users
- Message persistence and retrieval

## Deployment

### Local Deployment
- Use Docker Compose for all services
- Frontend served via Nginx in production container
- Backend runs as ASP.NET Core app
- Database via Azure SQL or local SQL Server

### Azure Deployment
- Use `deploy-to-azure.sh` for automated deployment
- Deploys to Azure Container Instances
- Uses Azure Front Door for load balancing
- Automatic SSL certificate management

## Troubleshooting

### Common Issues
1. **Database connection fails**: Check if SQL Server container is running
2. **ACS connection fails**: Verify connection string and network connectivity
3. **Authentication fails**: Check Entra ID configuration
4. **Messages not real-time**: Check ACS event handlers and network

### Debugging Tools
- **Browser DevTools**: For frontend debugging
- **Swagger UI**: For API testing (`/swagger`)
- **SQL Server Management Studio**: For database debugging
- **Azure Portal**: For ACS and Entra ID issues

### Logs
- Backend: Serilog with console and file output
- Frontend: Browser console logging
- Database: Docker logs (`docker logs simplechat-sqlserver`)

## Security Considerations

### Authentication
- Microsoft Entra ID for user authentication
- JWT tokens for API authorization
- Role-based access control

### Data Protection
- HTTPS everywhere in production
- SQL injection prevention via EF Core
- XSS prevention via React's built-in protection
- CSRF protection via ASP.NET Core

### ACS Security
- User access tokens with limited scope
- Identity mapping between Entra ID and ACS
- Secure token refresh mechanisms

## Performance Optimization

### Frontend
- Code splitting with Vite
- Lazy loading of components
- Optimistic UI updates for messaging
- Debounced API calls

### Backend
- Response caching where appropriate
- Database query optimization
- Async/await for I/O operations
- Proper connection pooling

### Database
- Appropriate indexing
- Query optimization
- Connection pooling
- Read replicas for scaling (future)

## Code Quality Standards

### Naming Conventions
- PascalCase for C# classes and methods
- camelCase for JavaScript/TypeScript
- snake_case for database objects
- kebab-case for file names

### Code Organization
- Single responsibility principle
- Dependency injection
- Interface segregation
- Proper error handling

### Documentation
- XML comments for C# public APIs
- JSDoc for TypeScript functions
- Markdown for architecture decisions
- Inline comments for complex logic

## Getting Help

### Documentation
- `README.md`: Getting started guide
- `DESIGN.md`: Detailed technical specifications
- `ARCHITECTURE_FIX.md`: Architecture decisions and fixes
- `SECURITY.md`: Security implementation details

### Development Scripts
- `./dev.sh`: Service management
- `./run_sql.py`: Database queries
- `./deploy-to-azure.sh`: Azure deployment
- `./drop-resources.sh`: Azure cleanup

Remember to always use `./dev.sh` for managing the development environment and `./run_sql.py` for database operations. These tools provide consistent, reliable interfaces for common development tasks.