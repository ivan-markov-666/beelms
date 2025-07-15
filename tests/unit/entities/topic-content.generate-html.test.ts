import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';

describe('TopicContent.generateHtml placeholder', () => {
  it('currently returns empty string', () => {
    const tc = new TopicContent();
    tc.content = '# Heading';
    tc.languageCode = 'en';
    expect(tc.generateHtml()).toBe('');
  });
});
