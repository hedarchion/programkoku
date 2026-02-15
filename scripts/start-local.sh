#!/bin/bash

# MM-Maker Local Development Startup Script
# This starts the Docker PDF service and the Next.js dev server

set -e

echo "🚀 Starting MM-Maker Local Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo -e "${BLUE}📦 Starting PDF Service (Docker)...${NC}"
docker-compose up -d pdf-service

# Wait for PDF service to be healthy
echo -e "${YELLOW}⏳ Waiting for PDF service to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PDF Service is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ PDF service failed to start. Check logs with: docker-compose logs pdf-service"
        exit 1
    fi
done

echo ""
echo -e "${BLUE}🌐 Starting Next.js Dev Server...${NC}"
echo -e "${GREEN}📝 The app will be available at: http://localhost:3000${NC}"
echo ""

# Start Next.js dev server
exec bun run dev
