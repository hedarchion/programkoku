# Local Development Setup

This guide explains how to run MM-Maker locally with Docker for PDF generation.

## Two Approaches for Mini-Services

The project has two ways to handle mini-services:

| Approach | Use Case | Location |
|----------|----------|----------|
| **Bun build** (existing) | Simple Node.js services without native deps | `.zscripts/mini-services-build.sh` |
| **Docker** (recommended for Puppeteer) | Services with Chrome/Chromium dependencies | `docker-compose.yml` |

### Why Docker for PDF Service?

Puppeteer requires Chrome which has **many system dependencies**:
- libnss3, libatk, libcups, libxss, etc.
- ~500MB+ of system libraries

Docker encapsulates all of this, making it:
- ✅ Portable across Linux distributions
- ✅ Consistent Chrome version
- ✅ No pollution of host system
- ✅ Easy to update/rebuild

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js Dev       │         │   PDF Microservice       │
│   Server            │────────▶│   (Docker + Puppeteer)   │
│   localhost:3000    │         │   localhost:3001         │
└─────────────────────┘         └──────────────────────────┘
        │                                    │
        │                                    │
        ▼                                    ▼
  UI/UX Development                  Chrome Headless
  (Hot reload)                        (PDF Generation)
```

## Quick Start

### 1. Prerequisites

- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **Bun** - [Install Bun](https://bun.sh/docs/installation)
- **Node.js 20+** (optional, Bun includes this)

### 2. Environment Setup

```bash
# Copy environment file
cp .env.local.example .env.local

# The default config should work for local development:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 3. Start Development Environment

**Using the helper script (recommended):**

```bash
./scripts/start-local.sh
```

This will:
1. Start the PDF service in Docker
2. Wait for it to be healthy
3. Start the Next.js dev server

**Or manually:**

```bash
# Terminal 1: Start PDF Service
docker-compose up -d pdf-service

# Wait for health check
curl http://localhost:3001/health

# Terminal 2: Start Next.js
bun run dev
```

### 4. Access the Application

- **Main App**: http://localhost:3000
- **PDF Service Health**: http://localhost:3001/health

### 5. Stop Development Environment

```bash
./scripts/stop-local.sh
```

Or manually:
```bash
docker-compose down
```

## PDF Service Details

### Docker Image

Uses the official Puppeteer Docker image:
- `ghcr.io/puppeteer/puppeteer:24.37.3`
- Chrome is pre-installed
- Runs as non-root user (`pptruser`)

### Service Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Port | `3001` | Service port |
| Max Payload | `12MB` | JSON body limit |
| CORS | `localhost:3000` | Allowed origins |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/export/opr/pdf` | POST | Generate OPR PDF |

### Request Example

```bash
curl -X POST http://localhost:3001/api/export/opr/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "namaProgram": "Mesyuarat Agung",
    "tarikh": "2026-02-15",
    "masa": "8:00 pagi",
    "tempat": "Surau",
    "gambarBase64": ["data:image/jpeg;base64,/9j/4AAQ..."],
    "schoolName": "SK Ayer Tawar"
  }' \
  --output test.pdf
```

## Development Workflow

### Making UI/UX Changes

Since the Next.js app runs locally (not in Docker), you get:
- **Hot reload** - Changes reflect instantly
- **Fast iteration** - No Docker rebuild needed
- **Full dev tools** - React DevTools, console, etc.

### Making PDF Template Changes

If you modify the PDF generation logic:

```bash
# 1. Edit mini-services/pdf-service/server.js

# 2. Restart the PDF service
docker-compose restart pdf-service

# 3. Or rebuild if needed
docker-compose up -d --build pdf-service
```

### Viewing PDF Service Logs

```bash
# Follow logs
docker-compose logs -f pdf-service

# Last 50 lines
docker-compose logs --tail=50 pdf-service
```

## Troubleshooting

### PDF Service Won't Start

```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs pdf-service

# Rebuild from scratch
docker-compose down
docker-compose up -d --build pdf-service
```

### "Failed to generate OPR PDF" Error

1. Check PDF service is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check the frontend is using the correct URL:
   ```bash
   cat .env.local
   # Should show: NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

3. Check browser console for CORS errors

### Port Conflicts

If ports 3000 or 3001 are in use:

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or change ports in:
# - package.json (for Next.js)
# - docker-compose.yml (for PDF service)
```

### Large Image Uploads Fail

The PDF service has a 12MB payload limit. If you have many/large images:
- Reduce image file sizes before upload
- Or increase the limit in `mini-services/pdf-service/server.js`:
  ```javascript
  app.use(express.json({ limit: '20mb' }));
  ```

## Alternative: No Docker (Not Recommended)

If you prefer not to use Docker, you can run Puppeteer locally:

```bash
# 1. Install Chrome dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y chromium-browser

# 2. Update .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# 3. The existing API route should work
# src/app/api/export/opr/pdf/route.ts
```

⚠️ **Note**: Running Puppeteer locally requires many system dependencies and may not work consistently across different OS versions.

## Production Deployment

For production, you have several options:

1. **Docker Compose on VPS** (DigitalOcean, Linode, etc.)
2. **Railway/Render/Fly.io** (container hosting)
3. **Separate services**: Static frontend (GitHub Pages) + Container backend

See `HOSTING.md` for more deployment options.

## Updating Puppeteer Version

To update the Puppeteer version:

1. Update `mini-services/pdf-service/package.json`
2. Update `mini-services/pdf-service/Dockerfile` base image tag
3. Rebuild:
   ```bash
   docker-compose down
   docker-compose up -d --build pdf-service
   ```
