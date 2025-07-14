import 'reflect-metadata';
import { SqliteFtsProvider } from '../../../packages/shared-types/src/providers/sqlite-fts-provider';
import { PostgresFtsProvider } from '../../../packages/shared-types/src/providers/postgres-fts-provider';
import { getFtsProvider, isFTSSupported } from '../../../packages/shared-types/src/providers/fts-provider';

describe('FTS Providers', () => {
  describe('SQLite FTS Provider', () => {
    let provider: SqliteFtsProvider;

    beforeEach(() => {
      provider = new SqliteFtsProvider();
    });

    it('should generate search vector with correct token frequencies', () => {
      const content = {
        languageCode: 'en',
        content: 'Testing is important for quality assurance',
        title: 'Testing Best Practices',
      };

      const vector = provider.generateSearchVector(content);

      expect(vector).toHaveProperty('testing');
      expect(vector['testing']).toBeGreaterThan(1); // Трябва да е по-голямо от 1, защото е в заглавието и съдържанието
      expect(vector).toHaveProperty('best');
      expect(vector).toHaveProperty('practices');
      expect(vector).toHaveProperty('important');
      expect(vector).toHaveProperty('quality');
      expect(vector).toHaveProperty('assurance');
    });

    it('should create search condition for single term', () => {
      const condition = provider.createSearchCondition('testing', 'en', 'searchVector');

      expect(condition).toContain('JSON_EXTRACT(searchVector');
      expect(condition).toContain('testing');
    });

    it('should create search condition for multiple terms', () => {
      const condition = provider.createSearchCondition('testing quality', 'en', 'searchVector');

      expect(condition).toContain('AND');
      expect(condition).toContain('testing');
      expect(condition).toContain('quality');
    });

    it('should generate ranking query', () => {
      const ranking = provider.generateRankingQuery('testing quality', 'en', 'searchVector');

      expect(ranking).toContain('CASE WHEN');
      expect(ranking).toContain('testing');
      expect(ranking).toContain('quality');
    });

    it('should report FTS as supported', () => {
      expect(provider.isFTSSupported()).toBe(true);
    });
  });

  describe('PostgreSQL FTS Provider', () => {
    let provider: PostgresFtsProvider;

    beforeEach(() => {
      provider = new PostgresFtsProvider();
    });

    it('should generate search vector expression for title and content', () => {
      const content = {
        languageCode: 'en',
        content: 'Testing is important',
        title: 'Testing Best Practices',
      };

      const vectorFn = provider.generateSearchVector(content);
      const expression = vectorFn();

      expect(expression).toContain("setweight(to_tsvector('english'");
      expect(expression).toContain('Testing Best Practices');
      expect(expression).toContain('Testing is important');
      expect(expression).toContain("'A')");
      expect(expression).toContain("'B')");
    });

    it('should generate search vector expression for content only', () => {
      const content = {
        languageCode: 'en',
        content: 'Testing is important',
      };

      const vectorFn = provider.generateSearchVector(content);
      const expression = vectorFn();

      expect(expression).toContain("to_tsvector('english'");
      expect(expression).toContain('Testing is important');
      expect(expression).toContain("'B')");
      expect(expression).not.toContain("'A')");
    });

    it('should create search condition', () => {
      const condition = provider.createSearchCondition('testing quality', 'en', 'searchVector');

      expect(condition).toContain('searchVector @@ to_tsquery');
      expect(condition).toContain('english');
      expect(condition).toContain('testing & quality');
    });

    it('should generate ranking query', () => {
      const ranking = provider.generateRankingQuery('testing quality', 'en', 'searchVector');

      expect(ranking).toContain('ts_rank_cd');
      expect(ranking).toContain('searchVector');
      expect(ranking).toContain('to_tsquery');
      expect(ranking).toContain('testing & quality');
    });

    it('should report FTS as supported', () => {
      expect(provider.isFTSSupported()).toBe(true);
    });
  });

  describe('FTS Provider Factory', () => {
    const originalEnv = process.env.DATABASE_TYPE;

    afterEach(() => {
      process.env.DATABASE_TYPE = originalEnv;
    });

    it('should return SQLite provider by default', () => {
      delete process.env.DATABASE_TYPE;
      const provider = getFtsProvider();
      expect(provider).toBeInstanceOf(SqliteFtsProvider);
    });

    it('should return PostgreSQL provider when specified', () => {
      process.env.DATABASE_TYPE = 'postgresql';
      const provider = getFtsProvider();
      expect(provider).toBeInstanceOf(PostgresFtsProvider);
    });

    it('should check if FTS is supported', () => {
      expect(isFTSSupported()).toBe(true);
    });
  });
});
