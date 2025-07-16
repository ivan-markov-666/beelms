import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';

describe('SqliteFtsProvider helper functions', () => {
  const provider = new SqliteFtsProvider();

  it('normalizeToken handles Cyrillic and special chars', () => {
    const input = 'ПрИмеР,,---Test';
    const normalized = provider.normalizeToken(input);
    // expect lowercase, cyrillic preserved, latin preserved, punctuation removed, single space collapse
    expect(normalized).toBe('пример test');
  });

  it('escapeLikePattern escapes % and _', () => {
    const escaped = provider.escapeLikePattern('100%_match');
    expect(escaped).toBe('100\\%\\_match');
  });

  it('generateRankingQuery uses bm25 and alias rank', () => {
    const sql = provider.generateRankingQuery('hello', 'bg', 'searchVector');
    expect(sql).toContain('bm25(searchVector)');
    expect(sql.toLowerCase()).toContain('rank');
  });
});
