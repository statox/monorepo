# Statox Monorepo

This monorepo contains both the backend API and frontend applications for the Statox platform.

## Structure

- `back/` - API backend (formerly api.statox.fr)
- `front/` - Frontend applications (formerly apps.statox.fr)

## Development

Each directory maintains its own package.json and can be developed independently:

### Backend

```bash
cd back
npm install
npm run watch    # TypeScript watcher
npm run serve    # Start server on port 3000
npm run tests    # Run tests
```

See `back/CLAUDE.md` and `back/DEV.md` for detailed backend documentation.

### Frontend

```bash
cd front
npm install
npm run dev      # Start dev server
npm run build    # Build for production
```

See `front/CLAUDE.md` for detailed frontend documentation.

## Docker Deployment

Both applications can be built and run using Docker:

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

Once running:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:8080

### Building Images

```bash
# Build both images
./scripts/build-all.sh

# Or build individually
./scripts/build-backend.sh
./scripts/build-frontend.sh
```

### Configuration

Before starting, copy the environment template and configure it:

```bash
cp back/.env.docker.example back/.env.docker
# Edit back/.env.docker with your configuration
```

See `DOCKER.md` for detailed Docker deployment documentation.

## Git Hooks

Git hooks are managed at the monorepo root level:

```bash
./githooks/setup.sh  # Install git hooks
```

## History

This monorepo was created by merging the git histories of two previously independent repositories:
- Backend: git@github.com:statox/api.statox.fr.git
- Frontend: git@github.com:statox/apps.statox.fr.git

All commit history from both repositories has been preserved. You can view the full history of any file:

```bash
git log back/package.json    # Shows full backend history
git log front/package.json   # Shows full frontend history
```
