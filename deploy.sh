#!/bin/bash

# Deployment script for Luji Contacts to Cloudflare Workers

echo "🚀 Starting deployment of Luji Contacts..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Deploy to Cloudflare Workers
echo "☁️ Deploying to Cloudflare Workers..."
npx wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is available at: https://luji-contacts.info-eac.workers.dev"
else
    echo "❌ Deployment failed."
    exit 1
fi
