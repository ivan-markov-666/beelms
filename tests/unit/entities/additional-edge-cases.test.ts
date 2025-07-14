import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';
import { validate } from 'class-validator';

describe('Entity edge cases', () => {
  it('Category.topicsCount returns 0 when topics undefined', () => {
    const c = new Category();
    expect(c.topicsCount).toBe(0);
  });

  it('Topic.hasContentInLanguage returns false when contents undefined', () => {
    const t = new Topic();
    expect(t.hasContentInLanguage('bg')).toBe(false);
  });

  it('TopicContent content over 10k chars is valid', async () => {
    const tc = new TopicContent();
    tc.languageCode = 'bg';
    tc.content = 'a'.repeat(11000);
    tc.topicId = '123e4567-e89b-12d3-a456-426614174000';
    const errors = await validate(tc);
    expect(errors.length).toBe(0);
  });

  it('Topic.slug with double dashes fails validation', async () => {
    const t = new Topic();
    t.categoryId = '123e4567-e89b-12d3-a456-426614174000';
    t.topicNumber = 1;
    t.name = 'Name';
    t.slug = 'invalid--slug';
    const errors = await validate(t);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });
});
