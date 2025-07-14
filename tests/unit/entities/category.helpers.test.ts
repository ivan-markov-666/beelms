import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';

describe('Category helper methods', () => {
  const buildTopic = (isPublished: boolean): Topic => {
    const t = new Topic();
    t.isPublished = isPublished;
    return t;
  };

  it('topicsCount returns correct length', () => {
    const c = new Category();
    c.topics = [buildTopic(true), buildTopic(false)];
    expect(c.topicsCount).toBe(2);
  });

  it('getActiveTopics returns only published topics', () => {
    const c = new Category();
    c.topics = [buildTopic(true), buildTopic(false), buildTopic(true)];
    expect(c.getActiveTopics().length).toBe(2);
    expect(c.getActiveTopics().every((t) => t.isPublished)).toBe(true);
  });

  it('description longer than 255 chars fails validation', async () => {
    const { validate } = await import('class-validator');
    const c = new Category();
    c.name = 'Long';
    c.description = 'x'.repeat(2000);
    c.colorCode = '#123456';
    c.iconName = 'long';
    c.sortOrder = 1;
    const errors = await validate(c);
    expect(errors.length).toBeGreaterThan(0);
  });
});
