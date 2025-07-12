# Database Migrations

This directory contains all database migrations for the QA-4-Free platform.

## Overview

Migrations provide a way to incrementally update the database schema, ensuring:

1. All developers and environments have identical database structures
2. Changes are applied in the correct order
3. Schema changes can be rolled back if needed
4. Compatibility between PostgreSQL (production) and SQLite (development/testing)

## Migration Files

- `1689151200000-CreateInitialSchema.ts`: The initial schema creation including all tables, constraints, indices and PostgreSQL-specific features like full-text search.

## Running Migrations

### Automatically (Recommended)

Migrations will run automatically on application startup in production environments. This is controlled by the `migrationsRun` setting in the TypeORM configuration:

```typescript
// In TypeOrmConfigService
migrationsRun: this.configService.get('DB_MIGRATIONS_RUN', true);
```

For production environments, this is set to `true` by default.

### Manually via CLI

You can also run migrations manually using the TypeORM CLI commands:

```bash
# Run all pending migrations
npm run typeorm migration:run

# Revert the most recently applied migration
npm run typeorm migration:revert
```

## Creating New Migrations

To create a new migration:

```bash
# Generate a migration file with changes
npm run typeorm migration:generate -- -n MigrationName
```

## SQLite Compatibility

All migrations are designed to work with both PostgreSQL (production) and SQLite (development/testing) by:

1. Using database-agnostic column types where possible
2. Conditionally creating PostgreSQL-specific features like:
   - `tsvector` columns and GIN indices for full-text search
   - Triggers for automatic timestamp updates
   - UUID generation

## Testing

To verify the migrations work correctly, run the entity relation tests:

```bash
npm run test -- relations.spec.ts
```

## PostgreSQL-Specific Features

The following PostgreSQL-specific features are implemented:

1. Full-text search on `topic_content` table
2. Triggers for automatically updating `updated_at` columns
3. UUID generation via `uuid-ossp` extension

For SQLite compatibility, these features are implemented differently or omitted as appropriate.
