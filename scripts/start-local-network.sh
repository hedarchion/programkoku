#!/bin/bash

# Script to start MM-Maker services for local network access
# This allows other devices on your network to access the PDF service

set -e

cd "$(dirname "$0")/.."

# Get the local IP address
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip addr show 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}' | cut -d'/' -f1)

if [ -z "$LOCAL_IP" ]; then
    echo "⚠️  Could not detect local IP address. Using default."
    LOCAL_IP="192.168.x.x"
fi

echo "═══════════════════════════════════════════════════════════"
echo "  MM-Maker Local Network Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📡 Your Local IP: $LOCAL_IP"
echo ""
echo "🌐 Services will be available at:"
echo "   • PDF Service:  http://$LOCAL_IP:3001"
echo "   • Health Check: http://$LOCAL_IP:3001/health"
echo ""
echo "💻 To use from other devices, set:"
echo "   NEXT_PUBLIC_API_BASE_URL=http://$LOCAL_IP:3001"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Export for docker-compose
export LOCAL_IP

# Update CORS in docker-compose to include this IP
sed -i "s|CORS_ALLOW_ORIGINS=.*|CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://$LOCAL_IP:3000,*|" docker-compose.yml

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down pdf-service 2>/dev/null || true

# Start PDF service
echo ""
echo "🚀 Starting PDF service..."
docker compose up --build -d pdf-service

# Wait for service to be ready
echo ""
echo "⏳ Waiting for service to be ready..."
sleep 3

# Check health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo ""
        echo "✅ PDF Service is ready!"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "  ✅ DEPLOYMENT SUCCESSFUL"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "📡 Backend (PDF Service): http://$LOCAL_IP:3001"
        echo ""
        echo "💻 To start the frontend for network access:"
        echo "   1. Set in .env.local:"
        echo "      NEXT_PUBLIC_API_BASE_URL=http://$LOCAL_IP:3001"
        echo ""
        echo "   2. Run: npm run dev"
        echo ""
        echo "   3. Access from other devices at:"
        echo "      http://$LOCAL_IP:3000"
        echo ""
        echo "🔍 Test commands:"
        echo "   curl http://$LOCAL_IP:3001/health"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo ""
echo "⚠️  Service did not become ready in time. Check logs:"
echo "   docker logs mm-maker-pdf"
exit 1
