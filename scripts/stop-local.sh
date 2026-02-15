#!/bin/bash

# Stop MM-Maker Local Development Environment

echo "🛑 Stopping MM-Maker Local Development Environment..."

# Stop Docker services
docker-compose down

echo -e "\033[0;32m✅ Services stopped.\033[0m"
