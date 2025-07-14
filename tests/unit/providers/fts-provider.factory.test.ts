import { getFtsProvider } from '../../../packages/shared-types/src/providers/fts-provider';
import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';
import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';

describe('FTS provider factory', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns SQLite provider by default', () => {
    delete process.env.DATABASE_TYPE;
    expect(getFtsProvider()).toBeInstanceOf(SqliteFtsProvider);
  });

  it('returns Postgres provider when DATABASE_TYPE=postgres', () => {
    process.env.DATABASE_TYPE = 'postgres';
    expect(getFtsProvider()).toBeInstanceOf(PostgresFtsProvider);
  });
});
