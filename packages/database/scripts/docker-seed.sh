#!/bin/bash

# LMS Database Seeding Docker Script
# Usage: ./scripts/docker-seed.sh [environment] [command] [options]

set -e

# Default values
ENV=${1:-dev}
COMMAND=${2:-run}
OPTIONS=${3:-}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|test|prod)$ ]]; then
    print_error "Invalid environment: $ENV. Must be one of: dev, test, prod"
    exit 1
fi

# Validate command
if [[ ! "$COMMAND" =~ ^(run|demo|status|build|up|down|logs|clean)$ ]]; then
    print_error "Invalid command: $COMMAND. Must be one of: run, demo, status, build, up, down, logs, clean"
    exit 1
fi

# Set environment file
ENV_FILE=".env.$ENV"

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file $ENV_FILE not found"
    exit 1
fi

print_info "Using environment: $ENV"
print_info "Using environment file: $ENV_FILE"

# Load environment variables
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Docker Compose file
COMPOSE_FILE="docker-compose.seeder.yml"

case $COMMAND in
    build)
        print_info "Building Docker images..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
        print_success "Docker images built successfully"
        ;;
    
    up)
        print_info "Starting services..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        print_success "Services started successfully"
        ;;
    
    down)
        print_info "Stopping services..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
        print_success "Services stopped successfully"
        ;;
    
    run)
        print_info "Running database seeding..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Run seeding
        if [[ -n "$OPTIONS" ]]; then
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm db-seeder tsx src/cli/seed.ts run $OPTIONS
        else
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm db-seeder
        fi
        
        print_success "Database seeding completed"
        ;;
    
    demo)
        print_info "Running seeding demonstration..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile demo run --rm db-seeder-demo
        print_success "Seeding demonstration completed"
        ;;
    
    status)
        print_info "Checking database status..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile status run --rm db-seeder-status
        ;;
    
    logs)
        print_info "Showing logs..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
        ;;
    
    clean)
        print_info "Cleaning up..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v
        docker system prune -f
        print_success "Cleanup completed"
        ;;
esac
