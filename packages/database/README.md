# @lms/database

Database seeding utilities for the LMS platform.

## Features

- **Multi-database support**: Works with both PostgreSQL and SQLite
- **Flexible seeding options**: Destructive/non-destructive modes
- **Entity-specific seeding**: Seed only specific entities if needed
- **Environment-aware**: Different data sets for dev/test/prod
- **Type-safe**: Full TypeScript support with proper typing

## Installation

```bash
pnpm install @lms/database
```

## Usage

### Basic Usage

```typescript
import { SeederFactory } from '@lms/database';

const factory = new SeederFactory();
const seeder = await factory.createDevSeeder();

await seeder.run();
await factory.close();
```

### PostgreSQL Usage

```typescript
import { SeederFactory } from '@lms/database';

const factory = new SeederFactory();
const seeder = await factory.createPostgreSQLSeeder({
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'lms_dev',
});

await seeder.run();
await factory.close();
```

### Custom Options

```typescript
import { SeederFactory } from '@lms/database';

const factory = new SeederFactory();
const seeder = await factory.createSeeder(
  {
    type: 'sqlite',
    database: './dev.db',
    synchronize: true,
  },
  {
    destructive: false,
    entities: ['users', 'categories'],
    environment: 'dev',
  }
);

await seeder.run();
await factory.close();
```

## Configuration

### SeederOptions

- `destructive` (boolean): Whether to clear existing data before seeding (default: true)
- `environment` ('dev' | 'test' | 'prod'): Environment for seeding (default: 'dev')
- `entities` (string[]): Specific entities to seed (default: all entities)
- `databaseType` ('postgres' | 'sqlite'): Database type (auto-detected)

### DatabaseConfig

- `type` ('postgres' | 'sqlite'): Database type
- `host` (string): Database host (PostgreSQL only)
- `port` (number): Database port (PostgreSQL only)
- `username` (string): Database username (PostgreSQL only)
- `password` (string): Database password (PostgreSQL only)
- `database` (string): Database name or file path
- `synchronize` (boolean): Whether to auto-sync schema (default: false)
- `logging` (boolean): Whether to enable query logging (default: false)

## Seeded Data

The seeder creates the following test data:

### Users

- **Admin**: admin@example.com / admin123
- **Instructor**: instructor@example.com / instructor123
- **Student**: student@example.com / student123

### Categories

- QA Fundamentals
- Test Automation
- Performance Testing
- Security Testing
- API Testing

### Topics

- Sample topics under QA Fundamentals category
- Each topic includes content and associated tests

## Development

```bash
# Build the package
pnpm build

# Watch for changes
pnpm dev

# Clean build artifacts
pnpm clean
```
