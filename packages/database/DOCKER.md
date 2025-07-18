# LMS Database Seeding - Docker Integration

This document describes the Docker integration for the LMS Database Seeding system, enabling containerized database seeding across different environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Components](#docker-components)
- [Environment Configuration](#environment-configuration)
- [Usage Examples](#usage-examples)
- [Commands Reference](#commands-reference)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Docker integration provides:

- **Containerized Seeding**: Run database seeding in isolated Docker containers
- **Multi-Environment Support**: Separate configurations for dev, test, and production
- **Service Orchestration**: Automated PostgreSQL setup and seeding coordination
- **Development Convenience**: Scripts, Makefile, and npm commands for easy operation
- **Production Ready**: Secure, configurable setup suitable for CI/CD pipelines

## 🔧 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development)
- pnpm (for package management)

## 🚀 Quick Start

### 1. Build and Run Development Environment

```bash
# Using Make (recommended)
make quick-dev

# Using npm scripts
pnpm docker:build
pnpm docker:seed:dev

# Using Docker Compose directly
docker-compose -f docker-compose.seeder.yml --env-file .env.dev build
docker-compose -f docker-compose.seeder.yml --env-file .env.dev up -d postgres
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder
```

### 2. Run Seeding Demonstration

```bash
# Using Make
make demo

# Using npm scripts
pnpm docker:demo

# Using scripts (Linux/macOS)
./scripts/docker-seed.sh dev demo

# Using scripts (Windows)
scripts\\docker-seed.bat dev demo
```

## 🐳 Docker Components

### Dockerfile.seeder

The main Dockerfile for the seeding service:

- **Base Image**: `node:18-alpine`
- **Security**: Non-root user (`seeder`)
- **Dependencies**: pnpm, tsx, PostgreSQL client
- **Health Check**: Built-in status monitoring
- **Working Directory**: `/app/packages/database`

### docker-compose.seeder.yml

Orchestrates the seeding environment:

- **postgres**: PostgreSQL database service
- **db-seeder**: Main seeding service
- **db-seeder-demo**: Demo service (profile: `demo`)
- **db-seeder-status**: Status service (profile: `status`)

### Environment Files

- `.env.dev`: Development environment
- `.env.test`: Test environment
- `.env.prod`: Production environment

## ⚙️ Environment Configuration

### Development (.env.dev)

```env
POSTGRES_DB=lms_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
SEEDER_ENVIRONMENT=dev
SEEDER_DESTRUCTIVE=true
SEEDER_VERBOSE=true
```

### Test (.env.test)

```env
POSTGRES_DB=lms_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
SEEDER_ENVIRONMENT=test
SEEDER_DESTRUCTIVE=true
SEEDER_VERBOSE=false
```

### Production (.env.prod)

```env
POSTGRES_DB=lms_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_in_production
SEEDER_ENVIRONMENT=prod
SEEDER_DESTRUCTIVE=false
SEEDER_VERBOSE=false
```

### Environment Variables

| Variable             | Description        | Default    | Required |
| -------------------- | ------------------ | ---------- | -------- |
| `POSTGRES_DB`        | Database name      | `lms_dev`  | Yes      |
| `POSTGRES_USER`      | Database user      | `postgres` | Yes      |
| `POSTGRES_PASSWORD`  | Database password  | `postgres` | Yes      |
| `SEEDER_ENVIRONMENT` | Seeder environment | `dev`      | Yes      |
| `SEEDER_ENTITIES`    | Entities to seed   | (all)      | No       |
| `SEEDER_DESTRUCTIVE` | Destructive mode   | `true`     | No       |
| `SEEDER_VERBOSE`     | Verbose logging    | `false`    | No       |

## 💡 Usage Examples

### Basic Seeding

```bash
# Seed development environment
make run ENV=dev

# Seed test environment
make run ENV=test

# Seed production environment
make run ENV=prod
```

### Selective Entity Seeding

```bash
# Seed only users and categories
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder tsx src/cli/seed.ts run --entities users,categories

# Seed with preserve mode
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder tsx src/cli/seed.ts run --preserve --verbose
```

### Service Management

```bash
# Start PostgreSQL service
make up ENV=dev

# Stop all services
make down ENV=dev

# View logs
make logs ENV=dev

# Clean up everything
make clean ENV=dev
```

## 📖 Commands Reference

### Make Commands

| Command        | Description                     |
| -------------- | ------------------------------- |
| `make help`    | Show help message               |
| `make build`   | Build Docker images             |
| `make up`      | Start PostgreSQL service        |
| `make down`    | Stop services                   |
| `make run`     | Run database seeding            |
| `make demo`    | Run seeding demonstration       |
| `make status`  | Check database status           |
| `make logs`    | Show service logs               |
| `make clean`   | Clean up containers and volumes |
| `make test`    | Run tests in Docker             |
| `make health`  | Check service health            |
| `make backup`  | Create database backup          |
| `make restore` | Restore database                |

### npm Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `pnpm docker:build`     | Build Docker images      |
| `pnpm docker:up`        | Start PostgreSQL service |
| `pnpm docker:down`      | Stop services            |
| `pnpm docker:seed`      | Run seeding (dev)        |
| `pnpm docker:seed:dev`  | Run seeding (dev)        |
| `pnpm docker:seed:test` | Run seeding (test)       |
| `pnpm docker:seed:prod` | Run seeding (prod)       |
| `pnpm docker:demo`      | Run demonstration        |
| `pnpm docker:status`    | Check database status    |
| `pnpm docker:logs`      | Show logs                |
| `pnpm docker:clean`     | Clean up                 |

### Shell Scripts

#### Linux/macOS (`./scripts/docker-seed.sh`)

```bash
./scripts/docker-seed.sh [environment] [command] [options]

# Examples
./scripts/docker-seed.sh dev run
./scripts/docker-seed.sh test demo
./scripts/docker-seed.sh prod status
```

#### Windows (`scripts\\docker-seed.bat`)

```cmd
scripts\\docker-seed.bat [environment] [command] [options]

# Examples
scripts\\docker-seed.bat dev run
scripts\\docker-seed.bat test demo
scripts\\docker-seed.bat prod status
```

## 🔧 Advanced Usage

### Custom Docker Compose Override

Create `docker-compose.override.yml` for local customizations:

```yaml
version: '3.8'

services:
  postgres:
    ports:
      - '5433:5432' # Use different port

  db-seeder:
    environment:
      SEEDER_VERBOSE: true
    volumes:
      - ./custom-logs:/app/logs
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Database Seeding
  run: |
    make build ENV=test
    make run ENV=test
    make clean ENV=test
```

### Multi-Stage Builds

```dockerfile
# Custom Dockerfile for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER seeder
CMD ["node", "dist/cli/seed.js", "run"]
```

### Health Monitoring

```bash
# Check container health
docker-compose -f docker-compose.seeder.yml --env-file .env.dev ps

# Monitor seeding progress
docker-compose -f docker-compose.seeder.yml --env-file .env.dev logs -f db-seeder

# Custom health check
docker-compose -f docker-compose.seeder.yml --env-file .env.dev exec db-seeder tsx src/cli/seed.ts status
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Container Build Failures

```bash
# Check Docker version
docker --version
docker-compose --version

# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.seeder.yml build --no-cache
```

#### 2. Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.seeder.yml --env-file .env.dev ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.seeder.yml --env-file .env.dev logs postgres

# Test connection
docker-compose -f docker-compose.seeder.yml --env-file .env.dev exec postgres psql -U postgres -d lms_dev -c "SELECT 1;"
```

#### 3. Permission Issues

```bash
# Check user permissions
docker-compose -f docker-compose.seeder.yml --env-file .env.dev exec db-seeder whoami

# Fix volume permissions
docker-compose -f docker-compose.seeder.yml --env-file .env.dev exec db-seeder chown -R seeder:seeder /app
```

#### 4. Environment Configuration

```bash
# Validate environment file
cat .env.dev | grep -v '^#' | grep '='

# Check environment in container
docker-compose -f docker-compose.seeder.yml --env-file .env.dev exec db-seeder env | grep -E '^(DB_|SEEDER_|NODE_)'
```

### Performance Optimization

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Optimize Docker Compose
docker-compose -f docker-compose.seeder.yml --env-file .env.dev --parallel up -d

# Monitor resource usage
docker stats
```

### Debugging

```bash
# Interactive debugging
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder sh

# Run with debug output
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder tsx src/cli/seed.ts run --verbose

# Check container logs
docker-compose -f docker-compose.seeder.yml --env-file .env.dev logs -f db-seeder
```

## 📝 Development Notes

- Use `make` commands for consistent development workflow
- Environment files are gitignored for security
- Health checks ensure database readiness before seeding
- Non-root user improves container security
- Volumes persist data between container restarts
- Profiles enable selective service running

## 🔒 Security Considerations

- Change default passwords in production
- Use secrets management for sensitive data
- Run containers with non-root user
- Limit network exposure
- Regular security updates for base images
- Audit environment configurations

## 🚀 Production Deployment

```bash
# Production example
export POSTGRES_PASSWORD=secure_password
export SEEDER_DESTRUCTIVE=false
make run ENV=prod
```

For production deployments, consider:

- Using Docker Swarm or Kubernetes
- Implementing proper secrets management
- Setting up monitoring and alerting
- Configuring log aggregation
- Implementing backup strategies
