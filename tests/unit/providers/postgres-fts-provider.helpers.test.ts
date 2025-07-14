import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';

describe('PostgresFtsProvider helper edge cases', () => {
  const provider = new PostgresFtsProvider();

  it('falls back to simple language config for invalid code', () => {
    const cond = provider.createSearchCondition('test', 'xx', 'vector');
    expect(cond).toContain(`to_tsquery('simple'`);
  });

  it('generateRankingQuery uses ts_rank_cd and alias', () => {
    const sql = provider.generateRankingQuery('hello', 'en', 'vector');
    expect(sql).toContain('ts_rank_cd');
    expect(sql.toLowerCase()).toContain('rank');
  });
});
