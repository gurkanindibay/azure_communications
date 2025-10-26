#!/bin/bash

# SimpleChat Azure Resource Cleanup Script
# This script deletes the entire resource group and all resources within it

set -e  # Exit on error

# Configuration variables (must match deploy-to-azure.sh)
RESOURCE_GROUP="rg-simplechat-demo"

echo "========================================="
echo "SimpleChat Azure Resource Cleanup"
echo "========================================="
echo ""
echo "WARNING: This will permanently delete the entire resource group '$RESOURCE_GROUP'"
echo "and ALL resources within it (SQL databases, containers, Front Door, etc.)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cleanup cancelled."
  exit 0
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || { echo "Please login to Azure first using 'az login'"; exit 1; }

# Check if resource group exists
if az group exists --name $RESOURCE_GROUP | grep -q "false"; then
  echo "Resource group '$RESOURCE_GROUP' does not exist. Nothing to clean up."
  exit 0
fi

echo "Deleting resource group '$RESOURCE_GROUP' and all resources within it..."
echo "This may take several minutes..."

az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --output table

echo ""
echo "========================================="
echo "Cleanup Complete!"
echo "========================================="
echo ""
echo "Resource group '$RESOURCE_GROUP' and all associated resources have been deleted."