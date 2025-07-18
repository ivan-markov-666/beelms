#!/usr/bin/env node

import 'reflect-metadata';
import { SeederFactory } from '../factories/seeder.factory';
import { SeederOptions } from '../seeders/database.seeder';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

interface CliOptions {
  env: 'dev' | 'test' | 'prod';
  entities?: string;
  preserve?: boolean;
  destructive?: boolean;
  verbose?: boolean;
}

function parseArgs(): { command: string; options: CliOptions } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options: CliOptions = {
    env: 'dev',
    preserve: false,
    destructive: false,
    verbose: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-e':
      case '--env':
        const envValue = args[++i];
        if (envValue === 'dev' || envValue === 'test' || envValue === 'prod') {
          options.env = envValue;
        } else {
          throw new Error(`Invalid environment: ${envValue}. Must be one of: dev, test, prod`);
        }
        break;
      case '-t':
      case '--entities':
        options.entities = args[++i];
        break;
      case '-p':
      case '--preserve':
        options.preserve = true;
        break;
      case '-d':
      case '--destructive':
        options.destructive = true;
        break;
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
    }
  }

  return { command, options };
}

function showHelp(): void {
  console.log(`
🌱 LMS Database Seeding CLI Tool v1.0.0
`);
  console.log('Usage: pnpm db:seed:dev [command] [options]\n');
  console.log('Commands:');
  console.log('  run      Run database seeding');
  console.log('  demo     Run seeding demonstration');
  console.log('  status   Check database seeding status');
  console.log('  help     Show this help message\n');
  console.log('Options:');
  console.log('  -e, --env <environment>    Environment (dev|test|prod) [default: dev]');
  console.log('  -t, --entities <entities>  Comma-separated list of entities to seed');
  console.log('  -p, --preserve             Preserve existing data (non-destructive mode)');
  console.log('  -d, --destructive          Clear existing data before seeding');
  console.log('  -v, --verbose              Enable verbose logging\n');
  console.log('Examples:');
  console.log('  pnpm db:seed:dev run');
  console.log('  pnpm db:seed:dev run --env test --entities users,categories');
  console.log('  pnpm db:seed:dev run --preserve --verbose');
  console.log('  pnpm db:seed:dev demo');
  console.log('  pnpm db:seed:dev status\n');
}

async function runSeeding(options: CliOptions): Promise<void> {
  const startTime = Date.now();

  try {
    if (options.verbose) {
      console.log('🌱 Starting database seeding...');
      console.log('📝 Options:', options);
    }

    // Parse entities if provided
    let entities: string[] | undefined;
    if (options.entities) {
      entities = options.entities.split(',').map((e: string) => e.trim());
      if (options.verbose) {
        console.log('🎯 Seeding entities:', entities);
      }
    }

    // Determine destructive mode
    const destructive = options.destructive ? true : !options.preserve;

    // Build seeder options
    const seederOptions: SeederOptions = {
      environment: options.env,
      destructive,
      entities,
    };

    // Create seeder factory
    const factory = new SeederFactory();
    let seeder;

    // Create appropriate seeder based on environment
    switch (options.env) {
      case 'dev':
        seeder = await factory.createDevSeeder(seederOptions);
        break;
      case 'test':
        seeder = await factory.createTestSeeder(seederOptions);
        break;
      case 'prod':
        seeder = await factory.createProdSeeder(seederOptions);
        break;
      default:
        throw new Error(`Unknown environment: ${options.env}`);
    }

    // Run seeding
    await seeder.run();

    const duration = Date.now() - startTime;
    console.log(`✅ Database seeding completed successfully in ${duration}ms`);

    // Close connections
    await factory.close();
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

async function runDemo(options: CliOptions): Promise<void> {
  try {
    if (options.verbose) {
      console.log('🎭 Running seeding demonstration...');
    }

    const factory = new SeederFactory();

    // Demo with different configurations
    console.log('\n🔄 Demo 1: Basic development seeding');
    const devSeeder = await factory.createDevSeeder();
    await devSeeder.run();

    console.log('\n🔄 Demo 2: Entity-specific seeding (users, categories)');
    const specificSeeder = await factory.createDevSeeder({
      entities: ['users', 'categories'],
      destructive: false,
    });
    await specificSeeder.run();

    console.log('\n🔄 Demo 3: Non-destructive seeding');
    const nonDestructiveSeeder = await factory.createDevSeeder({
      destructive: false,
    });
    await nonDestructiveSeeder.run();

    console.log('\n✅ All demos completed successfully!');

    await factory.close();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

async function showStatus(options: CliOptions): Promise<void> {
  try {
    console.log('📊 Database Status:');
    console.log('==================');
    console.log(`Environment: ${options.env}`);

    const factory = new SeederFactory();

    // Създаваме временен seeder за да инициализираме connection
    switch (options.env) {
      case 'dev':
        await factory.createDevSeeder();
        break;
      case 'test':
        await factory.createTestSeeder();
        break;
      case 'prod':
        await factory.createProdSeeder();
        break;
      default:
        throw new Error(`Unknown environment: ${options.env}`);
    }

    // Сега можем да получим информация за database type
    const provider = factory.getDatabaseProvider();
    console.log(`Database Type: ${provider.getDatabaseType()}`);
    console.log(`SQLite: ${provider.isSQLite()}`);
    console.log(`PostgreSQL: ${provider.isPostgreSQL()}`);

    // Показваме допълнителна информация за конфигурацията
    const dataSource = provider.getDataSource();
    console.log(`Connection Status: ${dataSource.isInitialized ? 'Connected' : 'Disconnected'}`);

    if (provider.isPostgreSQL()) {
      // Type casting за PostgreSQL опции
      const pgOptions = dataSource.options as PostgresConnectionOptions;
      console.log(`Host: ${pgOptions.host || 'localhost'}`);
      console.log(`Port: ${pgOptions.port || 5432}`);
      console.log(`Database: ${pgOptions.database}`);
      console.log(`Username: ${pgOptions.username}`);
    } else if (provider.isSQLite()) {
      // Type casting за SQLite опции
      const sqliteOptions = dataSource.options as SqliteConnectionOptions;
      console.log(`Database File: ${sqliteOptions.database}`);
    }

    console.log(`\n✅ Status check completed successfully!`);
    await factory.close();
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const { command, options } = parseArgs();

  switch (command) {
    case 'run':
      await runSeeding(options);
      break;
    case 'demo':
      await runDemo(options);
      break;
    case 'status':
      await showStatus(options);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ CLI execution failed:', error);
    process.exit(1);
  });
}
