#!/bin/bash
set -euo pipefail

# This entrypoint will use the managed identity assigned to the container to
# retrieve the PFX (base64) and the password secret from Key Vault, write the
# PFX to disk and set Kestrel env vars so the application can serve HTTPS.

if [ -z "${KEY_VAULT_NAME:-}" ] || [ -z "${CERT_NAME:-}" ]; then
  echo "KEY_VAULT_NAME or CERT_NAME not provided. Running app without certificate."
  exec dotnet SimpleChat.API.dll
fi

echo "Attempting to acquire access token from IMDS for Key Vault..."
TOKEN_JSON=$(curl -s -H "Metadata: true" "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net")
ACCESS_TOKEN=$(echo "$TOKEN_JSON" | jq -r .access_token)

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Failed to obtain access token from IMDS. Running app without certificate."
  exec dotnet SimpleChat.API.dll
fi

echo "Fetching PFX secret for certificate '$CERT_NAME' from Key Vault '$KEY_VAULT_NAME'..."
PFX_SECRET_JSON=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "https://${KEY_VAULT_NAME}.vault.azure.net/secrets/${CERT_NAME}?api-version=7.3")
PFX_BASE64=$(echo "$PFX_SECRET_JSON" | jq -r .value)

echo "Fetching PFX password secret '${CERT_NAME}-pwd' from Key Vault..."
PWD_SECRET_JSON=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "https://${KEY_VAULT_NAME}.vault.azure.net/secrets/${CERT_NAME}-pwd?api-version=7.3")
PFX_PASSWORD=$(echo "$PWD_SECRET_JSON" | jq -r .value)

if [ -z "$PFX_BASE64" ] || [ "$PFX_BASE64" = "null" ]; then
  echo "PFX secret not found in Key Vault. Running app without certificate."
  exec dotnet SimpleChat.API.dll
fi

mkdir -p /var/ssl
echo "$PFX_BASE64" | base64 -d > /var/ssl/cert.pfx
chmod 600 /var/ssl/cert.pfx

export ASPNETCORE_Kestrel__Certificates__Default__Path=/var/ssl/cert.pfx
export ASPNETCORE_Kestrel__Certificates__Default__Password="$PFX_PASSWORD"
export ASPNETCORE_URLS="https://+:443;http://+:8080"

echo "Starting application with loaded certificate..."
exec dotnet SimpleChat.API.dll
