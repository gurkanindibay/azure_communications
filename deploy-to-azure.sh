#!/bin/bash

# SimpleChat Azure Deployment Script
# This script deploys the SimpleChat application to Azure Container Instances

set -e  # Exit on error

# Configuration variables
RESOURCE_GROUP="rg-simplechat-demo"
LOCATION="westus2"
SQL_SERVER_NAME="simplechat-sql-server"
SQL_DATABASE_NAME="SimpleChatDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="YourStrong@Passw0rd2024!"
ACR_NAME="collectionregistry"  # Using existing ACR
ACR_RESOURCE_GROUP="collection-test-rg"  # Existing ACR resource group
BACKEND_CONTAINER_NAME="simplechat-backend"
FRONTEND_CONTAINER_NAME="simplechat-frontend"
KEY_VAULT_NAME="kv-simplechat-demo-2025"

BACKEND_DNS_LABEL="simplechat-backend-$(date +%s | tail -c 6)"

# Front Door settings
AFD_PROFILE_NAME="simplechat-afd"
AFD_ENDPOINT_NAME="simplechat-endpoint"
AFD_ORIGIN_GROUP="simplechat-origin-group"
AFD_BACKEND_ORIGIN_GROUP="simplechat-backend-origin-group"

# Azure AD Configuration (from existing setup)
AZURE_AD_TENANT_ID="a2b8448e-4362-4c41-ba77-8959e85aff31"
AZURE_AD_CLIENT_ID="b29d2aae-f1d9-4c00-81ce-13e2848fe728"

# ACS Configuration
ACS_RESOURCE_NAME="simplechat-communication"
ACS_CONNECTION_STRING="endpoint=https://$ACS_RESOURCE_NAME.unitedstates.communication.azure.com/;accesskey=PLACEHOLDER"

echo "========================================="
echo "SimpleChat Azure Deployment"
echo "========================================="

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || { echo "Please login to Azure first using 'az login'"; exit 1; }

# --------- Build control flags (defaults: build both images) ----------
# You can pass these flags to the script to skip image builds and speed up
# repeated deployments during development:
#   --skip-backend-build     Skip building & pushing the backend image
#   --skip-frontend-build    Skip building & pushing the frontend image
# Also supported (explicit): --build-backend true|false and --build-frontend true|false

BUILD_BACKEND=true
BUILD_FRONTEND=true

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-backend-build|--no-backend-build|--no-build-backend)
      BUILD_BACKEND=false
      shift
      ;;
    --skip-frontend-build|--no-frontend-build|--no-build-frontend)
      BUILD_FRONTEND=false
      shift
      ;;
    --build-backend)
      BUILD_BACKEND="$2"
      shift 2
      ;;
    --build-frontend)
      BUILD_FRONTEND="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--skip-backend-build] [--skip-frontend-build]"; exit 0
      ;;
    *)
      # unknown option - break parsing and continue with other args if any
      echo "Unknown option: $1"; exit 1
      ;;
  esac
done

# Print effective settings
echo "Build backend image: $BUILD_BACKEND"
echo "Build frontend image: $BUILD_FRONTEND"

# Step 1: Create Resource Group
echo ""
echo "Step 1: Checking resource group '$RESOURCE_GROUP'..."
if az group exists --name $RESOURCE_GROUP | grep -q "true"; then
  echo "Resource group '$RESOURCE_GROUP' already exists. Skipping creation."
else
  echo "Creating resource group '$RESOURCE_GROUP'..."
  az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table
fi

# Step 1.5: Create Azure Key Vault
echo ""
echo "Step 1.5: Checking Azure Key Vault '$KEY_VAULT_NAME'..."
if az keyvault show --name $KEY_VAULT_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "Key Vault '$KEY_VAULT_NAME' already exists. Skipping creation."
else
  echo "Checking for deleted Key Vault..."
  if az keyvault show-deleted --name $KEY_VAULT_NAME > /dev/null 2>&1; then
    echo "Recovering previously deleted Key Vault..."
    az keyvault recover --name $KEY_VAULT_NAME
    echo "Waiting for Key Vault recovery to complete..."
    sleep 30
  else
    echo "Creating Azure Key Vault '$KEY_VAULT_NAME'..."
    az keyvault create \
      --name $KEY_VAULT_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --enabled-for-deployment true \
      --enabled-for-template-deployment true \
      --output table
  fi
fi

# Step 2: Create Azure SQL Database (Serverless tier - most cost-effective for showcase)
echo ""
echo "Step 2: Checking Azure SQL Server '$SQL_SERVER_NAME'..."

# Check if SQL Server exists
if az sql server show --name $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "SQL Server '$SQL_SERVER_NAME' already exists. Skipping creation."
else
  echo "Creating Azure SQL Server (Serverless tier - auto-pauses when inactive)..."
  echo "SQL Server: $SQL_SERVER_NAME"
  echo "Database: $SQL_DATABASE_NAME"
  echo "Admin User: $SQL_ADMIN_USER"
  echo "Admin Password: $SQL_ADMIN_PASSWORD"

  az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --admin-user $SQL_ADMIN_USER \
    --admin-password "$SQL_ADMIN_PASSWORD" \
    --output table

  # Wait for SQL server to be fully provisioned
  echo "Waiting for SQL Server to be ready..."
  sleep 10

  # Configure firewall to allow Azure services
  echo "Configuring SQL Server firewall..."
  az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output table
fi

# Check if SQL Database exists
if az sql db show --name $SQL_DATABASE_NAME --server $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "SQL Database '$SQL_DATABASE_NAME' already exists. Skipping creation."
else
  # Create SQL Database with Serverless tier (cheapest for dev/showcase - pay per use)
  # Serverless auto-pauses when inactive, making it more cost-effective than Basic tier
  # Basic tier: ~$5/month constant
  # Serverless: ~$0.50-2/month depending on usage (pauses after 1 hour of inactivity)
  echo "Creating SQL Database with Serverless tier..."
  az sql db create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name $SQL_DATABASE_NAME \
    --edition GeneralPurpose \
    --family Gen5 \
    --capacity 1 \
    --compute-model Serverless \
    --auto-pause-delay 60 \
    --min-capacity 0.5 \
    --backup-storage-redundancy Local \
    --output table
fi

# Get SQL connection string
SQL_CONNECTION_STRING="Server=tcp:${SQL_SERVER_NAME}.database.windows.net,1433;Initial Catalog=${SQL_DATABASE_NAME};Persist Security Info=False;User ID=${SQL_ADMIN_USER};Password=${SQL_ADMIN_PASSWORD};MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

echo "SQL Connection String: $SQL_CONNECTION_STRING"

# Add current IP to SQL Server firewall rules
echo "Adding current IP to SQL Server firewall..."
CURRENT_IP=$(curl -s https://api.ipify.org)
if [ -n "$CURRENT_IP" ]; then
  echo "Current IP: $CURRENT_IP"
  az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name "DeploymentIP-$(date +%s)" \
    --start-ip-address $CURRENT_IP \
    --end-ip-address $CURRENT_IP \
    --output table
else
  echo "Warning: Could not determine current IP address. SQL connection may fail."
fi

# Step 2.5: Create Azure Communication Services resource
echo ""
echo "Step 2.5: Checking Azure Communication Services resource '$ACS_RESOURCE_NAME'..."

if az communication list --resource-group $RESOURCE_GROUP --query "[?name=='$ACS_RESOURCE_NAME']" --output tsv | grep -q "$ACS_RESOURCE_NAME"; then
  echo "ACS resource '$ACS_RESOURCE_NAME' already exists. Retrieving connection string..."
  ACS_CONNECTION_STRING=$(az communication list-key \
    --name $ACS_RESOURCE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query primaryConnectionString \
    --output tsv)
else
  echo "Creating Azure Communication Services resource..."
  az communication create \
    --name $ACS_RESOURCE_NAME \
    --resource-group $RESOURCE_GROUP \
    --location global \
    --data-location UnitedStates \
    --output table

  # Get the actual connection string
  ACS_CONNECTION_STRING=$(az communication list-key \
    --name $ACS_RESOURCE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query primaryConnectionString \
    --output tsv)
fi

echo "ACS Connection String retrieved successfully"

# Store ACS connection string in Key Vault
echo "Storing ACS connection string in Key Vault..."
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "AzureCommunicationServices--ConnectionString" \
  --value "$ACS_CONNECTION_STRING" \
  --output table

# Step 3: Get existing ACR credentials
echo ""
echo "Step 3: Using existing Azure Container Registry '$ACR_NAME'..."
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query passwords[0].value --output tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"

# Step 4: Build and push backend Docker image
echo ""
echo "Step 4: Building and pushing backend Docker image..."
cd src/backend
if [ "$BUILD_BACKEND" = "true" ]; then
  az acr build \
    --registry $ACR_NAME \
    --image simplechat-backend:latest \
    --file SimpleChat.API/Dockerfile \
    .
else
  echo "Skipping backend image build (per flags)."
fi
cd ../..

echo ""
echo ""
echo "Step 5: Setting up managed identity and Key Vault access for backend container."

# Create user-assigned managed identity for backend container
BACKEND_IDENTITY_NAME="simplechat-backend-identity"
echo "Creating user-assigned managed identity '$BACKEND_IDENTITY_NAME'..."
if az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "Managed identity '$BACKEND_IDENTITY_NAME' already exists. Skipping creation."
  BACKEND_IDENTITY_PRINCIPAL_ID=$(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query principalId --output tsv)
  BACKEND_IDENTITY_CLIENT_ID=$(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query clientId --output tsv)
else
  az identity create \
    --name $BACKEND_IDENTITY_NAME \
    --resource-group $RESOURCE_GROUP \
    --output table

  # Wait for managed identity to be fully provisioned
  echo "Waiting for managed identity to be provisioned..."
  sleep 30

  BACKEND_IDENTITY_PRINCIPAL_ID=$(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query principalId --output tsv)
  BACKEND_IDENTITY_CLIENT_ID=$(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query clientId --output tsv)
fi

# Assign Key Vault Secrets User role to the managed identity
echo "Assigning Key Vault Secrets User role to managed identity..."
az role assignment create \
  --assignee $BACKEND_IDENTITY_PRINCIPAL_ID \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show --name $KEY_VAULT_NAME --resource-group $RESOURCE_GROUP --query id --output tsv) \
  --output table

# Step 6: Deploy Backend to Azure Container Instances
echo ""
echo "Step 6: Preparing backend certificate and checking backend container instance '$BACKEND_CONTAINER_NAME'..."

# No backend certificate generation: using Front Door TLS termination and HttpOnly origins.
CERT_NAME="simplechat-backend-cert"
PFX_BASE64=""

if az container show --resource-group $RESOURCE_GROUP --name $BACKEND_CONTAINER_NAME > /dev/null 2>&1; then
  echo "Backend container instance '$BACKEND_CONTAINER_NAME' exists. Deleting it to recreate with updated configuration."
  az container delete --resource-group $RESOURCE_GROUP --name $BACKEND_CONTAINER_NAME --yes
fi

echo "Deploying backend to Azure Container Instances (HTTP on 8080)..."
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_CONTAINER_NAME \
  --os-type Linux \
  --image ${ACR_LOGIN_SERVER}/simplechat-backend:latest \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password "$ACR_PASSWORD" \
  --dns-name-label $BACKEND_DNS_LABEL \
  --ports 8080 \
  --cpu 1 \
  --memory 1.5 \
  --assign-identity $(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query id --output tsv) \
  --environment-variables \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    KeyVault__VaultUri="https://${KEY_VAULT_NAME}.vault.azure.net/" \
  --secure-environment-variables \
    ConnectionStrings__DefaultConnection="$SQL_CONNECTION_STRING" \
    AzureAd__TenantId=$AZURE_AD_TENANT_ID \
    AzureAd__ClientId=$AZURE_AD_CLIENT_ID \
  --output table

# Get backend FQDN
BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $BACKEND_CONTAINER_NAME --query ipAddress.fqdn --output tsv)
BACKEND_URL="http://${BACKEND_FQDN}:8080"

echo "Backend URL: $BACKEND_URL"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 30

# Step 7: Run database migrations
echo ""
echo "Step 7: Running database migrations..."
echo "Installing dotnet-ef tool..."
dotnet tool install --global dotnet-ef || dotnet tool update --global dotnet-ef

cd src/backend/SimpleChat.API
# Try to run migrations, but don't fail if they already exist
dotnet ef database update --connection "$SQL_CONNECTION_STRING" || echo "Database migrations may already be applied or connection failed. Continuing..."
cd ../../..

# Step 8: Build and push frontend Docker image
echo ""
echo "Step 8: Building and pushing frontend Docker image..."
cd src/frontend
if [ "$BUILD_FRONTEND" = "true" ]; then
  az acr build \
    --registry $ACR_NAME \
    --image simplechat-frontend:latest \
    --build-arg VITE_API_BASE_URL="/api" \
    --build-arg VITE_API_URL="" \
    --build-arg VITE_AZURE_AD_CLIENT_ID=$AZURE_AD_CLIENT_ID \
    --build-arg VITE_AZURE_AD_TENANT_ID=$AZURE_AD_TENANT_ID \
    --build-arg VITE_AZURE_AD_REDIRECT_URI="${FRONTEND_URL}" \
    .
else
  echo "Skipping frontend image build (per flags)."
fi
cd ../..

# Step 9: Deploy Frontend to Azure Container Instances
echo ""
echo "Step 9: Checking frontend container instance '$FRONTEND_CONTAINER_NAME'..."

if az container show --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME > /dev/null 2>&1; then
  echo "Frontend container instance '$FRONTEND_CONTAINER_NAME' already exists. Skipping creation."
  FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --query ipAddress.fqdn --output tsv)
else
  echo "Deploying frontend to Azure Container Instances..."
  az container create \
    --resource-group $RESOURCE_GROUP \
    --name $FRONTEND_CONTAINER_NAME \
    --os-type Linux \
    --image ${ACR_LOGIN_SERVER}/simplechat-frontend:latest \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password "$ACR_PASSWORD" \
    --dns-name-label simplechat-frontend-$(date +%s | tail -c 6) \
    --ports 80 \
    --cpu 0.5 \
    --memory 1 \
    --output table

  # Get frontend FQDN
  FRONTEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $FRONTEND_CONTAINER_NAME --query ipAddress.fqdn --output tsv)
fi
FRONTEND_URL="http://${FRONTEND_FQDN}"

# -----------------------------------------------------------------------------
# Step 10: Create Azure Front Door (Standard/Premium) profile and route to ACI
# - Front Door will terminate TLS and present a trusted HTTPS endpoint (azurefd.net)
# - We add the frontend ACI FQDN as an origin and create a route that maps /* -> origin
# NOTE: This requires the `az afd` command group (Front Door Standard/Premium). If
# your CLI does not have `az afd`, install/update the Azure CLI extension or use
# the Portal to create Front Door.
# -----------------------------------------------------------------------------
echo ""
echo "Step 10: Checking Azure Front Door profile '$AFD_PROFILE_NAME'..."

if az afd profile show --name $AFD_PROFILE_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
  echo "Front Door profile '$AFD_PROFILE_NAME' already exists. Updating backend origin configuration."
  FRONT_DOOR_HOSTNAME=$(az afd endpoint show --profile-name $AFD_PROFILE_NAME --resource-group $RESOURCE_GROUP --name $AFD_ENDPOINT_NAME --query hostName --output tsv 2>/dev/null || true)
  if [ -n "$FRONT_DOOR_HOSTNAME" ]; then
    FRONTEND_URL="https://${FRONT_DOOR_HOSTNAME}"
    echo "Front Door URL: $FRONTEND_URL"

    # Update backend origin to point to current backend container
    echo "Updating backend origin to point to current backend container: $BACKEND_FQDN"
    az afd origin update \
      --profile-name $AFD_PROFILE_NAME \
      --resource-group $RESOURCE_GROUP \
      --origin-group-name $AFD_BACKEND_ORIGIN_GROUP \
      --origin-name backend-aciorigin \
      --host-name $BACKEND_FQDN \
      --origin-host-header $BACKEND_FQDN \
      --output table || echo "Warning: Could not update backend origin. It may not exist yet."

    # Update API route patterns to include health endpoint
    echo "Updating API route patterns to include health endpoint..."
    az afd route update \
      --profile-name $AFD_PROFILE_NAME \
      --resource-group $RESOURCE_GROUP \
      --endpoint-name $AFD_ENDPOINT_NAME \
      --name 01-api-route \
      --patterns-to-match '/api/*' '/health' \
      --output table || echo "Warning: Could not update API route. It may not exist yet."

    # Purge Front Door cache for API routes
    echo "Purging Front Door cache for updated routes..."
    az afd endpoint purge \
      --resource-group $RESOURCE_GROUP \
      --profile-name $AFD_PROFILE_NAME \
      --endpoint-name $AFD_ENDPOINT_NAME \
      --domains $FRONT_DOOR_HOSTNAME \
      --content-paths "/api/*" "/health" || echo "Warning: Could not purge cache. Changes may take a few minutes to propagate."
  else
    echo "Warning: Could not determine existing Front Door hostname. Using ACI FQDN."
  fi
else
  echo "Creating Azure Front Door profile and routing to frontend ACI..."

  echo "Creating Front Door profile: $AFD_PROFILE_NAME"
  az afd profile create \
    --resource-group $RESOURCE_GROUP \
    --name $AFD_PROFILE_NAME \
    --sku Standard_AzureFrontDoor \
    --output table

  echo "Creating Front Door endpoint: $AFD_ENDPOINT_NAME"
  # Try to create the endpoint; if the name is globally unavailable (conflict),
  # try again with a short timestamp suffix to get an available name.
  set +e
  az afd endpoint create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --name $AFD_ENDPOINT_NAME \
    --output table
  rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "Endpoint name '$AFD_ENDPOINT_NAME' unavailable (conflict). Generating fallback name."
    SUFFIX=$(date +%s | tail -c 4)
    AFD_ENDPOINT_NAME="${AFD_ENDPOINT_NAME}-${SUFFIX}"
    echo "Retrying create with endpoint name: $AFD_ENDPOINT_NAME"
    az afd endpoint create \
      --profile-name $AFD_PROFILE_NAME \
      --resource-group $RESOURCE_GROUP \
      --name $AFD_ENDPOINT_NAME \
      --output table
  fi

  # Create origin group
  echo "Creating origin group: $AFD_ORIGIN_GROUP"
  az afd origin-group create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --origin-group-name $AFD_ORIGIN_GROUP \
    --enable-health-probe true \
    --probe-interval-in-seconds 30 \
    --probe-path /health \
    --probe-protocol Http \
    --probe-request-type GET \
    --sample-size 4 \
    --successful-samples-required 2 \
    --additional-latency-in-milliseconds 0 || true

  # Add frontend ACI as an origin (use HttpOnly between Front Door and ACI to avoid backend TLS requirement)
  ORIGIN_NAME="frontend-aciorigin"
  echo "Creating origin for frontend ACI: $FRONTEND_FQDN"
  az afd origin create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --origin-group-name $AFD_ORIGIN_GROUP \
    --origin-name $ORIGIN_NAME \
    --host-name $FRONTEND_FQDN \
    --http-port 80 \
    --https-port 443 \
    --origin-host-header $FRONTEND_FQDN \
    --priority 1 \
    --weight 100 \
    --enabled-state Enabled \
    --output table || true

  # Create backend origin group and origin (for API traffic) - use HttpOnly (Front Door -> origin over HTTP)
  echo "Creating backend origin group: $AFD_BACKEND_ORIGIN_GROUP"
  az afd origin-group create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --origin-group-name $AFD_BACKEND_ORIGIN_GROUP \
    --enable-health-probe true \
    --probe-interval-in-seconds 30 \
    --probe-path /health \
    --probe-protocol Http \
    --probe-request-type GET \
    --sample-size 4 \
    --successful-samples-required 2 \
    --additional-latency-in-milliseconds 0 || true

  BACKEND_ORIGIN_NAME="backend-aciorigin"
  echo "Creating origin for backend ACI: $BACKEND_FQDN"
  az afd origin create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --origin-group-name $AFD_BACKEND_ORIGIN_GROUP \
    --origin-name $BACKEND_ORIGIN_NAME \
    --host-name $BACKEND_FQDN \
    --http-port 8080 \
    --https-port 443 \
    --origin-host-header $BACKEND_FQDN \
    --priority 1 \
    --weight 100 \
    --enabled-state Enabled \
    --output table || true

  # Create a route for API traffic that maps /api/* to backend origin group (HTTP origin)
  API_ROUTE_NAME="api-route"
  echo "Creating route '$API_ROUTE_NAME' to origin group '$AFD_BACKEND_ORIGIN_GROUP'"
  az afd route create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --endpoint-name $AFD_ENDPOINT_NAME \
    --name $API_ROUTE_NAME \
    --origin-group $AFD_BACKEND_ORIGIN_GROUP \
    --patterns-to-match '/api/*' \
    --supported-protocols Http Https \
    --forwarding-protocol HttpOnly \
    --link-to-default-domain Enabled \
    --output table || true

  # Create a default route that maps all requests to the origin group
  ROUTE_NAME="default-route"
  echo "Creating route '$ROUTE_NAME' to origin group '$AFD_ORIGIN_GROUP'"
  az afd route create \
    --profile-name $AFD_PROFILE_NAME \
    --resource-group $RESOURCE_GROUP \
    --endpoint-name $AFD_ENDPOINT_NAME \
    --name $ROUTE_NAME \
    --origin-group $AFD_ORIGIN_GROUP \
    --patterns-to-match '/*' \
    --supported-protocols Http Https \
    --forwarding-protocol HttpOnly \
    --link-to-default-domain Enabled \
    --output table || true

  # Get Front Door generated hostname (e.g. <endpoint>.azurefd.net)
  FRONT_DOOR_HOSTNAME=$(az afd endpoint show --profile-name $AFD_PROFILE_NAME --resource-group $RESOURCE_GROUP --name $AFD_ENDPOINT_NAME --query hostName --output tsv 2>/dev/null || true)
  if [ -z "$FRONT_DOOR_HOSTNAME" ]; then
    echo "Warning: couldn't determine Front Door hostname automatically. You may need to check the portal or run 'az afd endpoint show' to get the hostname. Keeping FRONTEND_URL as the ACI FQDN for now."
  else
    FRONTEND_URL="https://${FRONT_DOOR_HOSTNAME}"
    echo "Front Door URL: $FRONTEND_URL"
    
    # Recreate backend container with correct CORS origins now that we have the Front Door URL
    echo "Recreating backend container with CORS origins for Front Door..."
    
    # Delete existing backend container
    az container delete --resource-group $RESOURCE_GROUP --name $BACKEND_CONTAINER_NAME --yes || true
    
    # Recreate with CORS environment variables
    echo "Deploying backend to Azure Container Instances with CORS configuration..."
    az container create \
      --resource-group $RESOURCE_GROUP \
      --name $BACKEND_CONTAINER_NAME \
      --os-type Linux \
      --image ${ACR_LOGIN_SERVER}/simplechat-backend:latest \
      --registry-login-server $ACR_LOGIN_SERVER \
      --registry-username $ACR_USERNAME \
      --registry-password "$ACR_PASSWORD" \
      --dns-name-label $BACKEND_DNS_LABEL \
      --ports 8080 \
      --cpu 1 \
      --memory 1.5 \
      --assign-identity $(az identity show --name $BACKEND_IDENTITY_NAME --resource-group $RESOURCE_GROUP --query id --output tsv) \
      --environment-variables \
        ASPNETCORE_ENVIRONMENT=Production \
        ASPNETCORE_URLS=http://+:8080 \
        KeyVault__VaultUri="https://${KEY_VAULT_NAME}.vault.azure.net/" \
        Cors__AllowedOrigins__0="$FRONTEND_URL" \
        Cors__AllowedOrigins__1="http://localhost:5173" \
        Cors__AllowedOrigins__2="http://localhost:3000" \
      --secure-environment-variables \
        ConnectionStrings__DefaultConnection="$SQL_CONNECTION_STRING" \
        AzureAd__TenantId=$AZURE_AD_TENANT_ID \
        AzureAd__ClientId=$AZURE_AD_CLIENT_ID \
      --output table

    # Get backend FQDN
    BACKEND_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $BACKEND_CONTAINER_NAME --query ipAddress.fqdn --output tsv)
    BACKEND_URL="http://${BACKEND_FQDN}:8080"
    echo "Backend URL: $BACKEND_URL"
  fi
fi

# Step 11: Rebuild frontend Docker image with correct API URLs
echo ""
echo "Step 11: Frontend image already built with relative API URLs (runtime-configurable)."

# Step 12: Restart frontend container to pick up new image
echo ""
echo "Step 12: Skipping frontend container restart (no rebuild needed)."

# Step 13: Update Azure AD App Registration with SPA redirect URI
echo ""
echo "Step 13: Updating Azure AD App Registration 'PgAzureMI' with SPA redirect URI..."

# Get current SPA redirect URIs
echo "Getting current SPA redirect URIs for app registration..."
CURRENT_URIS=$(az ad app show --id $AZURE_AD_CLIENT_ID --query spa.redirectUris --output tsv 2>/dev/null || echo "")

# Check if FRONTEND_URL is already in the list
if echo "$CURRENT_URIS" | grep -q "$FRONTEND_URL"; then
  echo "SPA redirect URI '$FRONTEND_URL' is already configured. Skipping update."
else
  echo "Adding SPA redirect URI '$FRONTEND_URL' to app registration..."
  
  # If there are existing URIs, we need to include them
  if [ -n "$CURRENT_URIS" ]; then
    # Convert space-separated URIs to JSON array format
    URI_ARRAY=$(echo "$CURRENT_URIS" | tr '\t' '\n' | jq -R . | jq -s . | jq -c ". + [\"$FRONTEND_URL\"]")
  else
    # No existing URIs, create array with just the new one
    URI_ARRAY="[\"$FRONTEND_URL\"]"
  fi
  
  # Update the app registration with SPA redirect URIs
  az ad app update \
    --id $AZURE_AD_CLIENT_ID \
    --spa-redirect-uris "$URI_ARRAY" \
    --output table
  
  echo "Successfully added SPA redirect URI to Azure AD App Registration 'PgAzureMI'."
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo ""
echo "SQL Server: $SQL_SERVER_NAME.database.windows.net"
echo "SQL Database: $SQL_DATABASE_NAME"
echo "SQL Admin User: $SQL_ADMIN_USER"
echo "SQL Admin Password: $SQL_ADMIN_PASSWORD"
echo ""
echo "Container Registry: $ACR_LOGIN_SERVER"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "========================================="
echo "IMPORTANT: Next Steps"
echo "========================================="
echo ""
echo "1. Azure AD App Registration 'PgAzureMI' has been automatically updated with the redirect URI."
echo ""
echo "2. Test the application:"
echo "   Open: ${FRONTEND_URL}"
echo ""
echo "========================================="

# Save deployment info to file
cat > deployment-info.txt <<EOF
SimpleChat Deployment Information
Generated: $(date)

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

SQL Server: $SQL_SERVER_NAME.database.windows.net
SQL Database: $SQL_DATABASE_NAME
SQL Admin User: $SQL_ADMIN_USER
SQL Admin Password: $SQL_ADMIN_PASSWORD
SQL Connection String: $SQL_CONNECTION_STRING

Container Registry: $ACR_LOGIN_SERVER
ACR Username: $ACR_USERNAME
ACR Password: $ACR_PASSWORD

Backend Container: $BACKEND_CONTAINER_NAME
Backend URL: $BACKEND_URL

Frontend Container: $FRONTEND_CONTAINER_NAME
Frontend URL: $FRONTEND_URL

Azure AD Tenant ID: $AZURE_AD_TENANT_ID
Azure AD Client ID: $AZURE_AD_CLIENT_ID

Key Vault: $KEY_VAULT_NAME
EOF

echo "Deployment information saved to: deployment-info.txt"
