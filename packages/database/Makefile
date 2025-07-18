# LMS Database Seeding Makefile
# Provides convenient commands for Docker-based database seeding

.PHONY: help build up down run demo status logs clean test

# Default environment
ENV ?= dev

# Default command
COMMAND ?= run

# Docker Compose file
COMPOSE_FILE = docker-compose.seeder.yml

# Environment file
ENV_FILE = .env.$(ENV)

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
help: ## Show this help message
	@echo "$(BLUE)LMS Database Seeding Commands$(NC)"
	@echo ""
	@echo "Usage: make [target] [ENV=environment]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-12s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Environments: dev, test, prod"
	@echo "Default environment: $(ENV)"

build: ## Build Docker images
	@echo "$(BLUE)[INFO]$(NC) Building Docker images for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build
	@echo "$(GREEN)[SUCCESS]$(NC) Docker images built successfully"

up: ## Start services (PostgreSQL)
	@echo "$(BLUE)[INFO]$(NC) Starting services for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d postgres
	@echo "$(BLUE)[INFO]$(NC) Waiting for PostgreSQL to be ready..."
	@sleep 10
	@echo "$(GREEN)[SUCCESS]$(NC) Services started successfully"

down: ## Stop services
	@echo "$(BLUE)[INFO]$(NC) Stopping services for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down
	@echo "$(GREEN)[SUCCESS]$(NC) Services stopped successfully"

run: ## Run database seeding
	@echo "$(BLUE)[INFO]$(NC) Running database seeding for $(ENV) environment..."
	@$(MAKE) up ENV=$(ENV)
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) run --rm db-seeder
	@echo "$(GREEN)[SUCCESS]$(NC) Database seeding completed"

demo: ## Run seeding demonstration
	@echo "$(BLUE)[INFO]$(NC) Running seeding demonstration for $(ENV) environment..."
	@$(MAKE) up ENV=$(ENV)
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) --profile demo run --rm db-seeder-demo
	@echo "$(GREEN)[SUCCESS]$(NC) Seeding demonstration completed"

status: ## Check database status
	@echo "$(BLUE)[INFO]$(NC) Checking database status for $(ENV) environment..."
	@$(MAKE) up ENV=$(ENV)
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) --profile status run --rm db-seeder-status

logs: ## Show logs
	@echo "$(BLUE)[INFO]$(NC) Showing logs for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f

clean: ## Clean up containers and volumes
	@echo "$(BLUE)[INFO]$(NC) Cleaning up for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v
	@docker system prune -f
	@echo "$(GREEN)[SUCCESS]$(NC) Cleanup completed"

test: ## Run tests in Docker
	@echo "$(BLUE)[INFO]$(NC) Running tests for $(ENV) environment..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) run --rm db-seeder pnpm test
	@echo "$(GREEN)[SUCCESS]$(NC) Tests completed"

# Environment-specific targets
dev: ## Run seeding for development environment
	@$(MAKE) run ENV=dev

test-env: ## Run seeding for test environment
	@$(MAKE) run ENV=test

prod: ## Run seeding for production environment
	@$(MAKE) run ENV=prod

# Quick commands
quick-dev: ## Quick dev setup: build, up, run
	@$(MAKE) build ENV=dev
	@$(MAKE) run ENV=dev

quick-test: ## Quick test setup: build, up, run
	@$(MAKE) build ENV=test
	@$(MAKE) run ENV=test

# Health checks
health: ## Check service health
	@echo "$(BLUE)[INFO]$(NC) Checking service health..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec postgres pg_isready -U postgres || true

# Backup and restore
backup: ## Backup database
	@echo "$(BLUE)[INFO]$(NC) Creating database backup..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec postgres pg_dump -U postgres -d $(shell grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) > backup_$(ENV)_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)[SUCCESS]$(NC) Database backup created"

restore: ## Restore database (specify BACKUP_FILE)
	@echo "$(BLUE)[INFO]$(NC) Restoring database from $(BACKUP_FILE)..."
	@docker-compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec -T postgres psql -U postgres -d $(shell grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) < $(BACKUP_FILE)
	@echo "$(GREEN)[SUCCESS]$(NC) Database restored"
