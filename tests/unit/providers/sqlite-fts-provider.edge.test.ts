import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';

describe('SqliteFtsProvider edge cases', () => {
  const provider = new SqliteFtsProvider();

  it('createSearchCondition returns 1=1 for empty or short query', () => {
    expect(provider.createSearchCondition('', 'bg', 'sv')).toBe('1=1');
    expect(provider.createSearchCondition('hi', 'bg', 'sv')).toBe('1=1'); // two letters
  });

  it('createSearchCondition with two terms uses AND twice', () => {
    const cond = provider.createSearchCondition('hello world', 'bg', 'sv');
    const andCount = (cond.match(/ AND /g) || []).length;
    expect(andCount).toBe(1);
  });

  it('escapeLikePattern escapes % and _', () => {
    expect(provider.escapeLikePattern('100%_match')).toBe('100\\%\\_match');
  });

  it('isFTSSupported returns true', () => {
    expect(provider.isFTSSupported()).toBe(true);
  });
});
