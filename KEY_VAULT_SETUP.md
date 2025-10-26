# Azure Key Vault Setup

This project uses Azure Key Vault to securely store sensitive configuration values.

## Key Vault Information
- **Name**: `kv-simplechat-93165`
- **Resource Group**: `rg-simplechat`
- **Location**: East US
- **URI**: `https://kv-simplechat-93165.vault.azure.net/`

## Secrets Stored in Key Vault

The following secrets are stored in Azure Key Vault:

1. **AzureAd--TenantId**: Azure AD Tenant ID
2. **AzureAd--ClientId**: Azure AD Client/Application ID
3. **AzureCommunicationServices--ConnectionString**: ACS connection string with access key

## How It Works

The backend application (`SimpleChat.API`) is configured to automatically read secrets from Azure Key Vault using:
- `Azure.Identity` package for authentication
- `Azure.Extensions.AspNetCore.Configuration.Secrets` for configuration integration
- `DefaultAzureCredential` for automatic authentication (uses Azure CLI credentials in development)

## Local Development Setup

1. **Ensure you're logged in to Azure CLI**:
   ```bash
   az login
   az account show
   ```

2. **Verify you have access to the Key Vault**:
   ```bash
   az keyvault secret list --vault-name kv-simplechat-93165
   ```

3. **Run the backend** - it will automatically fetch secrets from Key Vault:
   ```bash
   cd src/backend/SimpleChat.API
   dotnet run
   ```

## Adding New Secrets

To add a new secret to Key Vault:

```bash
az keyvault secret set \
  --vault-name kv-simplechat-93165 \
  --name "YourSecret--Name" \
  --value "your-secret-value"
```

**Note**: Use double dashes (`--`) in secret names to represent configuration hierarchy (e.g., `AzureAd--ClientId` maps to `AzureAd:ClientId` in appsettings.json).

## Viewing Secrets

To view a secret:

```bash
az keyvault secret show \
  --vault-name kv-simplechat-93165 \
  --name "AzureAd--TenantId" \
  --query value -o tsv
```

To list all secrets:

```bash
az keyvault secret list \
  --vault-name kv-simplechat-93165 \
  --query "[].name" -o table
```

## Production Deployment

For production deployments:

1. **Use Managed Identity**: Configure your App Service or Container with a Managed Identity
2. **Grant Key Vault Access**: Give the Managed Identity access to the Key Vault:
   ```bash
   az keyvault set-policy \
     --name kv-simplechat-93165 \
     --object-id <managed-identity-object-id> \
     --secret-permissions get list
   ```

3. **Update appsettings.json**: Ensure the `KeyVault:Name` configuration points to your Key Vault

## Security Best Practices

- ✅ Never commit secrets to source control
- ✅ Use Key Vault for all sensitive configuration
- ✅ Rotate secrets regularly
- ✅ Use Managed Identity in production
- ✅ Enable soft delete and purge protection on Key Vault
- ✅ Audit Key Vault access logs

## Troubleshooting

### "Authentication failed" error

Ensure you're logged in to Azure CLI:
```bash
az login
az account set --subscription <your-subscription-id>
```

### "Access denied" error

Verify you have the correct permissions:
```bash
az keyvault show --name kv-simplechat-93165 --query properties.accessPolicies
```

### Secrets not loading

Check the Key Vault name in `appsettings.json` matches your actual Key Vault:
```json
{
  "KeyVault": {
    "Name": "kv-simplechat-93165"
  }
}
```
