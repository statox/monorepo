# Docker Deployment Guide

This document describes how to build and deploy the Statox monorepo using Docker.

## Architecture

The monorepo is split into two separate Docker containers:

```
┌─────────────────────┐         ┌─────────────────────┐
│  Backend Container  │         │  Frontend Container │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │   Express     │  │         │  │   nginx       │  │
│  │   Node.js     │  │         │  │   Static SPA  │  │
│  │   Port 3000   │  │         │  │   Port 80     │  │
│  └───────────────┘  │         │  └───────────────┘  │
└─────────────────────┘         └─────────────────────┘
```

**Production URLs**:
- Backend: `api.statox.fr`
- Frontend: `apps.statox.fr`

**Local development URLs**:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:8080`

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

## Quick Start

### 1. Configure Environment

Copy the environment template and edit it with your configuration:

```bash
cp back/.env.docker.example back/.env.docker
```

Edit `back/.env.docker` and fill in:
- Database credentials
- Session secret
- S3/R2 credentials
- Notification credentials (Slack, ntfy.sh)
- Other service credentials as needed

### 2. Start Services

```bash
# Build and start all services
docker-compose up -d

# Or use the build script first
./scripts/build-all.sh
docker-compose up -d
```

### 3. Access Applications

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:8080
- **MySQL**: localhost:23306 (mapped from container's 3306)
- **LocalStack S3**: localhost:24566
- **Elasticsearch**: localhost:29200

**Note**: The backend dependencies (MySQL, LocalStack, Elasticsearch) are integrated from `back/src/tools/docker-compose.yml` to maintain consistency with existing local development setup.

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db         # MySQL
docker-compose logs -f localstack # S3
docker-compose logs -f elk        # Elasticsearch
```

### 5. Stop Services

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers + volumes (deletes data)
docker-compose down -v
```

## Building Images

### Build All

```bash
./scripts/build-all.sh
```

This builds both backend and frontend Docker images.

### Build Individually

```bash
# Backend only
./scripts/build-backend.sh

# Frontend only
./scripts/build-frontend.sh
```

### Manual Build

```bash
# Backend
docker build -t statox-backend:latest ./back

# Frontend
docker build -t statox-frontend:latest ./front
```

## Development Workflow

### Option 1: Docker Compose (Full Stack)

Best for testing the complete stack as it would run in production:

```bash
# Start everything
docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build

# View backend logs
docker-compose logs -f backend
```

### Option 2: Local Development (Faster Iteration)

Best for active development with hot-reload:

```bash
# Terminal 1: Backend
cd back
npm run watch & npm run serve

# Terminal 2: Frontend
cd front
npm run dev

# Terminal 3: MySQL (if needed)
docker-compose up mysql
```

## Image Details

### Backend Image

**Base**: `node:24-alpine`
**Exposed Port**: 3000

**Multi-stage build**:
1. **Builder stage**: Installs all dependencies and compiles TypeScript
2. **Production stage**: Only includes production dependencies and compiled code

**Startup sequence**:
1. Run release script (`node dist/src/tools/release/index.js`)
2. Start Express server (`node dist/index.js`)

**Health check**: HTTP GET to `/health/getRemoteTime` every 30s

### Frontend Image

**Base**: `nginx:alpine`
**Exposed Port**: 80

**Multi-stage build**:
1. **Builder stage**: Installs dependencies and builds SvelteKit static site
2. **Production stage**: nginx serving pre-built static files from `/docs`

**Health check**: HTTP GET to `/` every 30s

## Environment Variables

### Backend (.env.docker)

**Note**: Most development environment variables are already configured in `docker-compose.yml` (database, LocalStack S3, Elasticsearch). The `.env.docker` file is mainly for production overrides or additional services.

Default values in `docker-compose.yml`:

```env
# Database (from docker-compose.yml)
DB_HOST=db
DB_PORT=3306
DB_NAME=db
DB_USER=root
DB_PASSWORD=example

# LocalStack S3 (from docker-compose.yml)
R2_ENDPOINT=http://localstack:4566

# Elasticsearch (from docker-compose.yml)
ELK_HOST=elk
ELK_PORT=9200

# Application
PORT=3000
ENV=production
TZ=UTC
NODE_ENV=production
SESSION_SECRET=local-dev-secret-change-in-prod
```

Optional variables (for production or additional services):

```env
# Production S3/R2 credentials
R2_REGION=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Notifications
SLACK_WEBHOOK_URL=
SLACK_USER_ID=
NTFY_SH_TOPIC_URL=

# Meteo France
METEOFRANCE_TOKEN=
```

### Frontend (env.prod)

The frontend environment is configured in `front/env.prod`:

```env
PUBLIC_API_URL=https://api.statox.fr
```

For local development, this is automatically set to `http://localhost:3000` via `front/env.local`.

## Database Initialization

The MySQL container (`db` service) automatically initializes the database schema on first startup using SQL files from `back/src/tools/tables/`.

**Important**: By default, MySQL uses `tmpfs` (in-memory storage) for faster development and testing. Data is **not persistent** across container restarts. This matches the setup from `back/src/tools/docker-compose.yml`.

To use persistent storage, comment out the `tmpfs` section in `docker-compose.yml`:

```yaml
db:
  # ...
  # tmpfs:  # Comment this out for persistent data
  #   - /var/lib/mysql:rw
  volumes:
    - mysql-data:/var/lib/mysql  # Add this for persistence
```

To reinitialize the database:

```bash
# For tmpfs (in-memory): just restart
docker-compose restart db

# For persistent volumes: remove the volume
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Backend won't start

Check logs:
```bash
docker-compose logs backend
```

Common issues:
- Database not ready: Wait for MySQL health check to pass
- Missing environment variables: Check `back/.env.docker`
- Port 3000 already in use: Change port in `docker-compose.yml`

### Frontend won't build

Check build logs:
```bash
docker-compose logs frontend
```

Common issues:
- Build error: Check `front/` source code for TypeScript errors
- Missing dependencies: Ensure `package.json` is up to date

### Database connection errors

Verify MySQL is running:
```bash
docker-compose ps db
docker-compose logs db
```

Test connection:
```bash
# Using docker-compose exec
docker-compose exec db mysql -u root -p db

# Or via host port (password: example)
mysql -h 127.0.0.1 -P 23306 -u root -p db
```

### LocalStack S3 errors

Verify LocalStack is running:
```bash
docker-compose ps localstack
docker-compose logs localstack
```

Test S3 endpoint:
```bash
curl http://localhost:24566/_localstack/health
```

### Elasticsearch errors

Verify Elasticsearch is running:
```bash
docker-compose ps elk
docker-compose logs elk
```

Test connection:
```bash
curl http://localhost:29200
```

### Rebuilding after code changes

```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild everything
docker-compose up -d --build
```

## Production Deployment

Production deployment uses Traefik on a VPS for routing:

```
Internet
   │
   ▼
Traefik (VPS)
   ├─→ api.statox.fr  → Backend Container (port 3000)
   └─→ apps.statox.fr → Frontend Container (port 80)
```

Deployment process:
1. Build images locally or in CI/CD
2. Push images to container registry
3. Pull images on VPS
4. Update docker-compose configuration with production env vars
5. Start containers with Traefik labels for routing

(Detailed production deployment instructions will be added later)

## Useful Commands

```bash
# Enter backend container shell
docker-compose exec backend sh

# Enter frontend container shell
docker-compose exec frontend sh

# Enter MySQL container shell
docker-compose exec mysql bash

# View container resource usage
docker stats

# Remove all unused images
docker image prune -a

# View all containers
docker-compose ps

# Restart a service
docker-compose restart backend
```

## File Structure

```
monorepo/
├── back/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.docker (git-ignored)
├── front/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── scripts/
│   ├── build-all.sh
│   ├── build-backend.sh
│   └── build-frontend.sh
├── docker-compose.yml
└── DOCKER.md (this file)
```

## Performance Considerations

### Image Size

- Backend: ~200-300 MB (Alpine Linux + Node.js + app)
- Frontend: ~50-100 MB (Alpine Linux + nginx + static files)

### Build Time

- Backend: 2-5 minutes (npm install + TypeScript compilation)
- Frontend: 3-7 minutes (npm install + SvelteKit build)

### Resource Usage

Typical resource usage:
- Backend: 100-200 MB RAM, minimal CPU
- Frontend: 10-20 MB RAM, minimal CPU
- MySQL: 200-400 MB RAM

## Security Notes

- Never commit `.env.docker` to git (it's in `.gitignore`)
- Use strong passwords for database and session secret
- In production, use proper SSL/TLS termination (handled by Traefik)
- Frontend is served over HTTPS in production
- Backend uses secure cookies in production

## Next Steps

- [ ] Set up automated CI/CD pipeline
- [ ] Configure container registry (Docker Hub, GHCR, etc.)
- [ ] Document production deployment process
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
