# LMS Database Seeding CLI Tool

🌱 A command-line interface for seeding the LMS database with test data.

## Installation

The CLI tool is included as part of the `@lms/database` package and can be run using npm scripts or directly with tsx.

## Usage

### Available Commands

#### 1. `run` - Run Database Seeding

Executes the database seeding process with various options.

```bash
# Basic usage
pnpm db:seed:dev run

# With environment specification
pnpm db:seed:dev run --env test

# Seed specific entities only
pnpm db:seed:dev run --entities users,categories

# Non-destructive mode (preserve existing data)
pnpm db:seed:dev run --preserve

# Destructive mode (clear existing data first)
pnpm db:seed:dev run --destructive

# Verbose logging
pnpm db:seed:dev run --verbose

# Combined options
pnpm db:seed:dev run --env test --entities users,categories --preserve --verbose
```

#### 2. `demo` - Run Seeding Demonstration

Shows different seeding scenarios for demonstration purposes.

```bash
# Run demonstration
pnpm db:seed:dev demo

# With verbose output
pnpm db:seed:dev demo --verbose
```

#### 3. `status` - Check Database Status

Displays database connection and configuration information.

```bash
# Check status for dev environment
pnpm db:seed:dev status

# Check status for specific environment
pnpm db:seed:dev status --env prod
```

#### 4. `help` - Show Help

Displays usage information and available commands.

```bash
pnpm db:seed:dev help
```

### Options

| Option          | Short | Description                                   | Default      |
| --------------- | ----- | --------------------------------------------- | ------------ |
| `--env`         | `-e`  | Environment (dev\|test\|prod)                 | `dev`        |
| `--entities`    | `-t`  | Comma-separated list of entities to seed      | All entities |
| `--preserve`    | `-p`  | Preserve existing data (non-destructive mode) | `false`      |
| `--destructive` | `-d`  | Clear existing data before seeding            | `true`       |
| `--verbose`     | `-v`  | Enable verbose logging                        | `false`      |

### Environments

- **`dev`** - Development environment using SQLite in-memory database
- **`test`** - Test environment using SQLite in-memory database
- **`prod`** - Production environment using PostgreSQL database

### Available Entities

The following entities can be seeded individually or in combination:

- `users` - System users (admin, instructors, students)
- `categories` - Course categories
- `topics` - Course topics
- `topicContent` - Topic content and materials
- `tests` - Assessments and quizzes
- `questions` - Test questions
- `questionOptions` - Multiple choice options

### Examples

```bash
# Seed all entities in development environment
pnpm db:seed:dev run

# Seed only users and categories in test environment
pnpm db:seed:dev run --env test --entities users,categories

# Non-destructive seeding with verbose output
pnpm db:seed:dev run --preserve --verbose

# Production seeding (requires PostgreSQL connection)
pnpm db:seed:dev run --env prod --destructive

# Check database status
pnpm db:seed:dev status --env prod

# Run demonstration
pnpm db:seed:dev demo --verbose
```

## Direct Usage with tsx

You can also run the CLI directly using tsx:

```bash
# Install tsx globally (if not already installed)
npm install -g tsx

# Run commands directly
tsx src/cli/seed.ts help
tsx src/cli/seed.ts run --verbose
tsx src/cli/seed.ts demo
tsx src/cli/seed.ts status
```

## Environment Variables

For PostgreSQL environments, the following environment variables are supported:

- `DB_HOST` - Database host (default: 'localhost')
- `DB_PORT` - Database port (default: 5432)
- `DB_USERNAME` - Database username (default: 'postgres')
- `DB_PASSWORD` - Database password (default: 'password')
- `DB_DATABASE` - Database name (default: 'lms_dev' for dev, 'lms_prod' for prod)

## Error Handling

The CLI tool provides comprehensive error handling:

- ✅ Argument validation
- ✅ Environment validation
- ✅ Database connection error handling
- ✅ Seeding process error handling
- ✅ Graceful shutdown and cleanup

## Exit Codes

- `0` - Success
- `1` - Error (invalid arguments, database connection failure, seeding failure)

## Integration Testing

The CLI tool includes integration tests that verify:

- Argument parsing and validation
- Help output
- Environment validation
- Command execution (with mocked database connections)

Run integration tests:

```bash
pnpm test -- --testNamePattern="CLI Integration"
```

## Development

### Adding New Commands

1. Add the command handler function in `src/cli/seed.ts`
2. Add the command to the main switch statement in the `main()` function
3. Update the `showHelp()` function to include the new command
4. Add integration tests for the new command

### Adding New Options

1. Add the option to the `CliOptions` interface
2. Add the option parsing logic in `parseArgs()` function
3. Update the `showHelp()` function to document the new option
4. Add tests for the new option

## Architecture

The CLI tool follows a modular architecture:

- **`seed.ts`** - Main CLI entry point with argument parsing
- **`SeederFactory`** - Factory for creating seeder instances
- **`DatabaseSeeder`** - Core seeding logic
- **`DatabaseProvider`** - Database connection management

This design allows for easy extension and testing while maintaining separation of concerns.
