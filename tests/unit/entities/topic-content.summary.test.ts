import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';

describe('TopicContent.getSummary', () => {
  it('returns full text when shorter than maxLength', () => {
    const tc = new TopicContent();
    tc.content = 'Short text';
    expect(tc.getSummary()).toBe('Short text');
  });

  it('strips markdown and truncates long text', () => {
    const tc = new TopicContent();
    const longText = '# Heading\n**Bold** '.repeat(30); // >150 chars after stripping
    tc.content = longText;
    const summary = tc.getSummary(100);
    expect(summary.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(summary.endsWith('...')).toBe(true);
    expect(summary).not.toMatch(/#/); // header removed
    expect(summary).not.toMatch(/\*\*/); // bold removed
  });
});
