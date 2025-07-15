import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';

describe('PostgresFtsProvider internal helpers', () => {
  const provider = new PostgresFtsProvider();

  it('normalizeQuery converts to "word & word" form and removes punctuation', () => {
    // @ts-expect-error accessing private for test
    const result = provider.normalizeQuery('Hello, world!');
    expect(result).toBe('Hello & world');
  });

  it('normalizeQuery drops single-char words', () => {
    // @ts-expect-error accessing private for test
    const result = provider.normalizeQuery('a b cd');
    expect(result).toBe('cd');
  });

  it('escapeSql doubles quotes and backslashes', () => {
    // @ts-expect-error private access
    const escaped = provider.escapeSql("O'Hara \\ ");
    expect(escaped).toContain("O''Hara");
    // should contain doubled backslashes
    expect(escaped).toMatch(/\\\\/);
  });

  it('language fallback to simple for unknown code', () => {
    const cond = provider.createSearchCondition('test', 'xx', 'vec');
    expect(cond).toContain("'simple'");
  });

  it('isFTSSupported returns true', () => {
    expect(provider.isFTSSupported()).toBe(true);
  });
});
