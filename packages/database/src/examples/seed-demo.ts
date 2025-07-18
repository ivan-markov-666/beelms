#!/usr/bin/env node

import 'reflect-metadata';
import { SeederFactory } from '../factories/seeder.factory';

async function runSeedDemo(): Promise<void> {
  console.log('🌱 Database Seeding Demo');
  console.log('========================');

  const factory = new SeederFactory();

  try {
    // Demo 1: Basic SQLite seeding
    console.log('\n📦 Demo 1: Basic SQLite Seeding');
    console.log('-------------------------------');

    const seeder = await factory.createDevSeeder();
    await seeder.run();

    console.log('✅ Basic seeding completed successfully!');

    // Demo 2: Entity-specific seeding
    console.log('\n🎯 Demo 2: Entity-specific Seeding');
    console.log('-----------------------------------');

    const specificSeeder = await factory.createDevSeeder({
      entities: ['users', 'categories'],
      destructive: false,
    });

    await specificSeeder.run();

    console.log('✅ Entity-specific seeding completed successfully!');

    // Demo 3: Non-destructive seeding
    console.log('\n💡 Demo 3: Non-destructive Seeding');
    console.log('-----------------------------------');

    const nonDestructiveSeeder = await factory.createDevSeeder({
      destructive: false,
    });

    await nonDestructiveSeeder.run();

    console.log('✅ Non-destructive seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding demo:', error);
    process.exit(1);
  } finally {
    await factory.close();
  }
}

// CLI Usage
if (require.main === module) {
  runSeedDemo()
    .then(() => {
      console.log('\n🎉 All seeding demos completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

export { runSeedDemo };
