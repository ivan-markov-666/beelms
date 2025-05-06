import { DataSource } from 'typeorm';

async function testMigrationLoading() {
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'test_user',
      password: 'test_password',
      database: 'test_db',
      synchronize: false,
      logging: true,
      entities: [],
      migrations: [__dirname + '/*.ts'], // Директно към .ts файловете в основната директория
      migrationsTableName: 'migrations_history_test',
    });

    console.log('Опит за свързване с базата данни...');
    await dataSource.initialize();
    console.log('Връзката с базата данни е успешна!');

    console.log('Опит за извличане на миграциите...');
    const migrations = dataSource.migrations;
    console.log(`Намерени са ${migrations.length} миграции:`);
    migrations.forEach((m) => console.log(`- ${m.name}`));

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Грешка:', error);
    process.exit(1);
  }
}

testMigrationLoading();
