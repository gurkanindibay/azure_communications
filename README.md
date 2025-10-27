# Simple Chat Application

A real-time 1-on-1 chat application built with React, ASP.NET Core, and Azure Communication Services.

## Prerequisites

- **Node.js** 18+ and npm
- **.NET 8.0 SDK**
- **Docker Desktop** (for running SQL Server locally)
- **Azure Subscription** (for Azure Communication Services and Microsoft Entra ID)

## Project Structure

```
azure_communications/
├── src/
│   ├── backend/               # ASP.NET Core Web API
│   │   ├── SimpleChat.API/    # Web API project
│   │   ├── SimpleChat.Core/   # Domain entities
│   │   ├── SimpleChat.Infrastructure/ # Database context & configs
│   │   └── SimpleChat.Application/    # Business logic
│   └── frontend/              # React + TypeScript app (to be created)
├── database/
│   └── init/                  # SQL initialization scripts
├── docker-compose.yml         # Docker configuration for SQL Server
├── .env.local                 # Local environment variables
└── README.md                  # This file
```

## Getting Started

### Quick Setup (Recommended)

Run the automated setup script:

```bash
# Make script executable (if not already)
chmod +x setup-dev.sh

# Run setup
./setup-dev.sh
```

This script will:
- Check prerequisites (.NET, Node.js, Docker)
- Configure User Secrets for secure credential storage
- Start the database
- Run initial migrations

### Manual Setup

If you prefer to set up manually:

#### 1. Start the Database

```bash
docker-compose up -d
```

#### 2. Configure Secrets Securely

**For Local Development (User Secrets):**

```bash
cd src/backend/SimpleChat.API

# Initialize user secrets
dotnet user-secrets init

# Set your secrets
dotnet user-secrets set "AzureCommunicationServices:ConnectionString" "your_acs_connection_string"
dotnet user-secrets set "AzureAd:TenantId" "your_tenant_id"
dotnet user-secrets set "AzureAd:ClientId" "your_client_id"
```

**For Production (Environment Variables):**

```bash
export AzureCommunicationServices__ConnectionString="your_acs_connection_string"
export AzureAd__TenantId="your_tenant_id"
export AzureAd__ClientId="your_client_id"
```

#### 3. Run Database Migrations

```bash
cd src/backend/SimpleChat.API
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .
```

#### Create Azure Communication Services Resource

```bash
# Login to Azure
az login

# Create ACS resource
az communication create \
  --name simplechat-acs \
  --resource-group your-resource-group \
  --location "Global" \
  --data-location "UnitedStates"

# Get connection string
az communication list-key \
  --name simplechat-acs \
  --resource-group your-resource-group \
  --query primaryConnectionString \
  --output tsv
```

#### Register Microsoft Entra ID Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **App registrations** > **New registration**
3. Name: `SimpleChat API`
4. Supported account types: **Accounts in this organizational directory only**
5. Redirect URI: **Web** - `https://localhost:7001/signin-oidc`
6. Click **Register**
7. Note down the **Application (client) ID** and **Directory (tenant) ID**
8. Go to **Certificates & secrets** > **New client secret**
9. Add description and expiry, click **Add**
10. **Copy the secret value immediately** (it won't be shown again)

#### Update Configuration

**⚠️ IMPORTANT: Never commit secrets to version control!**

Choose one of the following secure configuration methods:

**Option 1: User Secrets (Recommended for .NET developers):**

```bash
cd src/backend/SimpleChat.API

# Initialize user secrets (only needed once)
dotnet user-secrets init

# Set secrets
dotnet user-secrets set "AzureCommunicationServices:ConnectionString" "your_acs_connection_string_here"
dotnet user-secrets set "AzureAd:TenantId" "your_tenant_id_here"
dotnet user-secrets set "AzureAd:ClientId" "your_client_id_here"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your_database_connection_string_here"
```

**Option 2: Local Configuration File (Alternative):**

```bash
cd src/backend/SimpleChat.API

# Copy the template and fill in your values
cp appsettings.template.json appsettings.Local.json

# Edit appsettings.Local.json with your actual values
# This file is gitignored and won't be committed
```

**Option 3: Environment Variables (For production or CI/CD):**

```bash
export AzureCommunicationServices__ConnectionString="your_acs_connection_string_here"
export AzureAd__TenantId="your_tenant_id_here"
export AzureAd__ClientId="your_client_id_here"
export ConnectionStrings__DefaultConnection="your_database_connection_string_here"
```

**Setup Instructions:**
1. Copy `appsettings.template.json` to `appsettings.json` (this file is gitignored)
2. Fill in your actual values for local development
3. For production, use environment variables or Key Vault

### 3. Run Database Migrations

```bash
cd src/backend/SimpleChat.API

# Install EF Core tools (if not already installed)
dotnet tool install --global dotnet-ef

# Create initial migration
dotnet ef migrations add InitialCreate --project ../SimpleChat.Infrastructure --startup-project .

# Apply migration to database
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .
```

### 4. Run the Backend API

```bash
cd src/backend/SimpleChat.API
dotnet run
```

The API will start on `https://localhost:7001` and `http://localhost:5000`.

Access Swagger UI at: `https://localhost:7001/swagger`

### 5. Run the Frontend (Coming Soon)

The frontend React application will be created in the next steps.

## Database Management

### View Database

Connect to the SQL Server database using your preferred tool:

- **Server**: `localhost,1433`
- **Database**: `SimpleChatDB`
- **User**: `sa`
- **Password**: `YourStrong@Passw0rd`

### Stop Database

```bash
docker-compose down
```

### Reset Database

```bash
# Stop and remove containers, volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-run migrations
cd src/backend/SimpleChat.API
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .
```

## Development Workflow

### Backend Development

1. Make changes to code
2. The API will auto-reload (hot reload enabled in Development mode)
3. Test endpoints using Swagger UI or Postman

### Add New Migration

When you modify entities or database configuration:

```bash
cd src/backend/SimpleChat.API
dotnet ef migrations add YourMigrationName --project ../SimpleChat.Infrastructure --startup-project .
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .
```

### Build Solution

```bash
cd src/backend
dotnet build
```

### Run Tests (Coming Soon)

```bash
cd src/backend
dotnet test
```

## Project Status

### ✅ Completed
- [x] Project structure created
- [x] Docker SQL Server setup
- [x] .NET solution with layered architecture
- [x] Domain entities (User, ChatThread, Message, ReadReceipt)
- [x] EF Core DbContext and configurations
- [x] NuGet packages installed

### 🚧 In Progress
- [ ] Repository pattern implementation
- [ ] Service layer (Business logic)
- [ ] API controllers
- [ ] JWT authentication
- [ ] ACS integration

### 📋 To Do
- [ ] React frontend application
- [ ] Authentication flow
- [ ] Real-time chat UI
- [ ] User management
- [ ] Message history
- [ ] Read receipts
- [ ] Online status indicators

## Troubleshooting

### SQL Server Won't Start

```bash
# Check Docker logs
docker logs simplechat-sqlserver

# Restart container
docker-compose restart
```

### Port Already in Use

If ports 1433, 5000, or 7001 are already in use:

1. Stop the conflicting service
2. Or modify ports in `docker-compose.yml` and `launchSettings.json`

### Migration Errors

```bash
# Drop database and recreate
dotnet ef database drop --project ../SimpleChat.Infrastructure --startup-project . --force
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .
```

## Next Steps

1. ✅ Create database migrations
2. 🔄 Implement repository pattern
3. 🔄 Create service layer
4. 🔄 Build API controllers
5. 🔄 Set up authentication
6. 🔄 Initialize React frontend
7. 🔄 Implement chat UI

## Azure Deployment

### Deploy to Azure

To deploy the application to Azure Container Instances with Azure Front Door:

```bash
# Make scripts executable
chmod +x deploy-to-azure.sh
chmod +x drop-resources.sh

# Run deployment
./deploy-to-azure.sh
```

The script will:
1. Create resource group and SQL database
2. Build and push Docker images to Azure Container Registry
3. Deploy backend and frontend to Azure Container Instances
4. Set up Azure Front Door for HTTPS termination and routing
5. Configure CORS and update frontend with correct URLs

### Cleanup Azure Resources

To delete all Azure resources created by the deployment:

```bash
./drop-resources.sh
```

**Warning**: This will permanently delete the entire resource group and all resources within it.

### Deployment Configuration

Update the following variables in `deploy-to-azure.sh` if needed:
- `RESOURCE_GROUP`: Azure resource group name
- `LOCATION`: Azure region
- `ACR_NAME`: Azure Container Registry name
- `ACR_RESOURCE_GROUP`: Resource group containing the ACR
- Azure AD and ACS connection details

## Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [Azure Communication Services](https://docs.microsoft.com/azure/communication-services)
- [Microsoft Entra ID](https://docs.microsoft.com/azure/active-directory)
- [React Documentation](https://react.dev)

## License

This project is for educational purposes.
