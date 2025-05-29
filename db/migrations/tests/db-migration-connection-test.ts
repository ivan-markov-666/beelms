import { DataSource } from 'typeorm';
import { CreateInitialSchema1683456789000 } from '../migrations/1683456789000-CreateInitialSchema';
import { AddAdditionalIndices1683456789001 } from '../migrations/1683456789001-AddAdditionalIndices';

async function testMigrationLoading() {
  try {
    // Конфигуриране на връзката с реалната база данни
    const dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: 'postgres123',
      database: 'learning_platform',
      synchronize: false,
      logging: true,
      entities: [],
      migrations: [CreateInitialSchema1683456789000, AddAdditionalIndices1683456789001],
      migrationsTableName: 'migrations_history_test',
    });

    console.log('Опит за свързване с базата данни...');
    await dataSource.initialize();
    console.log('Връзката с базата данни е успешна!');

    console.log('Опит за извличане на миграциите...');
    const migrations = dataSource.migrations;
    console.log(`Намерени са ${migrations.length} миграции:`);
    migrations.forEach((m) => console.log(`- ${m.name || m.constructor.name}`));

    // Правилно затваряне на връзката
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Грешка:', error);
    process.exit(1);
  }
}

// Стартиране на тестовата функция
testMigrationLoading();
