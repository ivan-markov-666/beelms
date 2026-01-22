import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../auth/user.entity';

const ADMIN_EMAIL = 'functionzero0@gmail.com';

function loadEnv(): void {
  const candidatePaths = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '.env'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      return;
    }
  }

  dotenv.config();
}

loadEnv();

const SeedDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'beelms',
  password: process.env.DB_PASSWORD ?? 'beelms',
  database: process.env.DB_NAME ?? 'beelms',
  entities: [User],
  synchronize: false,
});

async function promoteDevAdmin(): Promise<void> {
  await SeedDataSource.initialize();

  try {
    const repo = SeedDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: ADMIN_EMAIL } });

    if (!user) {
      console.error(
        `User with email ${ADMIN_EMAIL} not found. Please register the account before running this script.`,
      );
      process.exit(1);
    }

    user.role = 'admin';
    user.active = true;
    user.emailVerified = true;

    await repo.save(user);

    console.log(`User ${ADMIN_EMAIL} is now an active admin.`);
  } finally {
    await SeedDataSource.destroy();
  }
}

promoteDevAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to promote dev admin user', err);
    process.exit(1);
  });
