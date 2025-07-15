import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';

describe('SqliteFtsProvider.generateSearchVector token counts', () => {
  const provider = new SqliteFtsProvider();

  it('counts duplicate tokens correctly', () => {
    const vector = provider.generateSearchVector({ languageCode: 'bg', content: 'hello hello HELLO!', title: 'Hello' });
    expect(vector['hello']).toBe(6); // 3 from title (weighted) + 3 from content
  });
});
