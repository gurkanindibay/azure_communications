#!/bin/bash

# Simple Chat Application - Development Setup Script
# This script helps set up the development environment securely

set -e

echo "🚀 Setting up Simple Chat Application for development..."
echo ""

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK is not installed. Please install .NET 8.0 SDK first."
    echo "   Download from: https://dotnet.microsoft.com/download"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Navigate to backend directory
cd src/backend/SimpleChat.API

echo "🔧 Setting up secure configuration for local development..."
echo ""
echo "Choose your preferred configuration method:"
echo "1) User Secrets (recommended for .NET developers)"
echo "2) Local configuration file (appsettings.Local.json)"
echo ""

read -p "Enter your choice (1 or 2): " config_choice

case $config_choice in
    1)
        echo "📝 Setting up User Secrets..."
        # Initialize user secrets
        dotnet user-secrets init
        
        echo ""
        echo "📝 Please provide your Azure credentials (these will be stored securely in User Secrets):"
        echo ""
        
        read -p "Azure Communication Services Connection String: " acs_connection_string
        read -p "Azure AD Tenant ID: " tenant_id
        read -p "Azure AD Client ID: " client_id
        read -p "Database Connection String (press Enter for local Docker SQL Server): " db_connection
        
        # Set default database connection if not provided
        if [ -z "$db_connection" ]; then
            db_connection="Server=localhost,1433;Database=SimpleChatDB;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;MultipleActiveResultSets=true"
        fi
        
        # Set the secrets
        dotnet user-secrets set "AzureCommunicationServices:ConnectionString" "$acs_connection_string"
        dotnet user-secrets set "AzureAd:TenantId" "$tenant_id"
        dotnet user-secrets set "AzureAd:ClientId" "$client_id"
        dotnet user-secrets set "ConnectionStrings:DefaultConnection" "$db_connection"
        
        echo "✅ User Secrets configured successfully!"
        ;;
    2)
        echo "📝 Creating local configuration file..."
        
        # Copy template to local config
        cp appsettings.template.json appsettings.Local.json
        
        echo ""
        echo "📝 Please edit 'appsettings.Local.json' with your actual values."
        echo "   The file has been created with placeholder values that you need to replace."
        echo ""
        echo "   Required values to update:"
        echo "   - AzureCommunicationServices:ConnectionString"
        echo "   - AzureAd:TenantId"
        echo "   - AzureAd:ClientId"
        echo "   - ConnectionStrings:DefaultConnection (optional, defaults to local SQL Server)"
        echo ""
        echo "✅ Local configuration file created at: appsettings.Local.json"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac
echo ""
echo "🔄 Setting up database..."

# Go back to project root
cd ../../..

# Start database
echo "Starting SQL Server container..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 30

# Run migrations
echo "Running database migrations..."
cd src/backend/SimpleChat.API
dotnet ef database update --project ../SimpleChat.Infrastructure --startup-project .

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Backend: cd src/backend/SimpleChat.API && dotnet run"
echo "  2. Frontend: cd src/frontend && npm install && npm run dev"
echo ""
echo "Happy coding! 🚀"