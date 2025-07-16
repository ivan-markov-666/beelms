import { isFTSSupported, getFtsProvider } from '../../../packages/shared-types/src/providers/fts-provider';
import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';
import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';

describe('isFTSSupported delegating', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('delegates to Postgres provider', () => {
    process.env.DATABASE_TYPE = 'postgresql';
    const provider = getFtsProvider();
    expect(provider).toBeInstanceOf(PostgresFtsProvider);
    expect(isFTSSupported()).toBe(true);
  });

  it('fallback to SQLite for unknown DB', () => {
    process.env.DATABASE_TYPE = 'mysql';
    const provider = getFtsProvider();
    expect(provider).toBeInstanceOf(SqliteFtsProvider);
  });
});
