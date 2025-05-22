#!/bin/bash
# deploy.sh - Deploy standalone IVR server to Azure App Service

# Variables
APP_NAME="YOUR_AZURE_APP_NAME"
RESOURCE_GROUP="YOUR_RESOURCE_GROUP"
LOCATION="southindia"

# 1. Create App Service using Azure CLI
echo "Creating/Updating App Service..."
az webapp up \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B1 \
  --html

echo "Deployment completed!"
echo "Your Twilio webhook URL should be: https://$APP_NAME.azurewebsites.net/"
