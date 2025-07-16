import 'reflect-metadata';
import { validate } from 'class-validator';
import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';

describe('TopicContent Entity', () => {
  const createValidContent = (): TopicContent => {
    const c = new TopicContent();
    c.topicId = '123e4567-e89b-12d3-a456-426614174000';
    c.languageCode = 'bg';
    c.content = '## Заглавие\nТекст на урока';
    return c;
  };

  it('validates correct content', async () => {
    const c = createValidContent();
    const errors = await validate(c);
    expect(errors.length).toBe(0);
  });

  it('detects invalid language', async () => {
    const c = createValidContent();
    // @ts-expect-error testing invalid
    c.languageCode = 'fr';
    const errors = await validate(c);
    expect(errors.some((e) => e.property === 'languageCode')).toBe(true);
  });
});
