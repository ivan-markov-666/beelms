import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';
import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';

describe('FTS Providers', () => {
  it('Sqlite provider generateSearchVector returns token map', () => {
    const provider = new SqliteFtsProvider();
    const vector = provider.generateSearchVector({ languageCode: 'bg', content: 'Hello hello world', title: 'Hello' });
    expect(vector['hello']).toBeGreaterThan(1);
    expect(vector['world']).toBe(1);
  });

  it('Sqlite createSearchCondition contains LIKE', () => {
    const provider = new SqliteFtsProvider();
    const cond = provider.createSearchCondition('hello world', 'bg', 'searchVector');
    expect(cond.toLowerCase()).toContain('like');
  });

  it('Postgres provider generateSearchVector returns function producing to_tsvector', () => {
    const provider = new PostgresFtsProvider();
    const exprFn = provider.generateSearchVector({ languageCode: 'en', content: 'text', title: 'title' });
    const expr = exprFn();
    expect(expr).toContain('to_tsvector');
  });

  it('Postgres createSearchCondition contains @@', () => {
    const provider = new PostgresFtsProvider();
    const cond = provider.createSearchCondition('hello world', 'en', 'searchVector');
    expect(cond).toContain('@@');
  });
});
