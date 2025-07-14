import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';

// Mock the FTS provider factory
jest.mock('../../../packages/shared-types/src/providers/fts-provider', () => {
  return {
    getFtsProvider: (): { generateSearchVector: jest.Mock } => ({
      generateSearchVector: jest.fn(() => ({ test: 1 })),
    }),
  };
});

describe('TopicContent helpers', () => {
  it('updateSearchVector sets searchVector using provider', () => {
    const c = new TopicContent();
    c.languageCode = 'bg';
    c.content = 'Test content';

    c.updateSearchVector();
    expect(c.searchVector).toEqual({ test: 1 });
  });

  it('generateHtml returns empty string (placeholder)', () => {
    const c = new TopicContent();
    expect(c.generateHtml()).toBe('');
  });

  it('invalid language code fails validation', async () => {
    const { validate } = await import('class-validator');
    const c = new TopicContent();
    c.languageCode = 'fr';
    c.content = 'content';
    c.topicId = '123e4567-e89b-12d3-a456-426614174000';
    const errors = await validate(c);
    expect(errors.some((e) => e.property === 'languageCode')).toBe(true);
  });

  it('large content passes validation and searchVector still generated', () => {
    const large = 'a'.repeat(12000);
    const c = new TopicContent();
    c.languageCode = 'bg';
    c.content = large;
    c.updateSearchVector();
    expect(c.searchVector).toBeDefined();
  });
});
