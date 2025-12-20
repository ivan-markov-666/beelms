import { AppDataSource } from '../data-source';

const run = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();

    const hasPending = await AppDataSource.showMigrations();

    if (hasPending) {
      process.stderr.write('Pending migrations detected\n');
      process.exitCode = 1;
      return;
    }

    process.stdout.write('No pending migrations\n');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

run().catch((err: unknown) => {
  process.stderr.write('Migration check failed\n');
  if (err instanceof Error) {
    process.stderr.write(`${err.message}\n`);
  }
  process.exit(1);
});
