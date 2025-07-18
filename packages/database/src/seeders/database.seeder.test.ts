import { SeederFactory } from '../factories/seeder.factory';
import { DatabaseSeeder } from './database.seeder';

describe('DatabaseSeeder', () => {
  let factory: SeederFactory;
  let seeder: DatabaseSeeder;

  beforeEach(async () => {
    factory = new SeederFactory();
  });

  afterEach(async () => {
    if (factory) {
      await factory.close();
    }
  });

  describe('Basic Functionality', () => {
    it('should create a DatabaseSeeder instance', async () => {
      // Act
      seeder = await factory.createTestSeeder();

      // Assert
      expect(seeder).toBeInstanceOf(DatabaseSeeder);
    });

    it('should detect SQLite database type', async () => {
      // Act
      seeder = await factory.createTestSeeder();

      // Assert
      const provider = factory.getDatabaseProvider();
      expect(provider.isSQLite()).toBe(true);
      expect(provider.isPostgreSQL()).toBe(false);
      expect(provider.getDatabaseType()).toBe('sqlite');
    });

    it('should have correct seeder options', async () => {
      // Act
      seeder = await factory.createTestSeeder({
        destructive: false,
        entities: ['users'],
        environment: 'test',
      });

      // Assert
      expect(seeder).toBeDefined();
      // Test passes if no errors are thrown
    });
  });

  describe('Database Provider', () => {
    it('should create development seeder', async () => {
      // Act
      seeder = await factory.createDevSeeder();

      // Assert
      expect(seeder).toBeInstanceOf(DatabaseSeeder);
    });

    it('should create test seeder', async () => {
      // Act
      seeder = await factory.createTestSeeder();

      // Assert
      expect(seeder).toBeInstanceOf(DatabaseSeeder);
    });
  });
});
