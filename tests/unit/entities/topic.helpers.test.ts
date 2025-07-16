import { validate } from 'class-validator';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';

describe('Topic helper methods & validation', () => {
  const buildTopic = (): Topic => {
    const t = new Topic();
    t.contents = [];
    return t;
  };

  it('hasContentInLanguage / getContentByLanguage work correctly', () => {
    const t = buildTopic();
    const bg = new TopicContent();
    bg.languageCode = 'bg';
    const en = new TopicContent();
    en.languageCode = 'en';
    t.contents = [bg, en];

    expect(t.hasContentInLanguage('bg')).toBe(true);
    expect(t.hasContentInLanguage('de')).toBe(false);
    expect(t.getContentByLanguage('en')).toBe(en);
  });

  it('invalid estimatedReadingTime fails validation', async () => {
    const t = buildTopic();
    t.categoryId = '123e4567-e89b-12d3-a456-426614174000';
    t.topicNumber = 0;
    t.name = 'name';
    t.slug = 'slug';
    t.estimatedReadingTime = 0;
    const errors = await validate(t);
    expect(errors.some((e) => e.property === 'estimatedReadingTime')).toBe(true);
  });
});
