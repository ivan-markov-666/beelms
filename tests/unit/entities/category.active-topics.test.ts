import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';

describe('Category.getActiveTopics edge cases', () => {
  const buildTopic = (published: boolean): Topic => {
    const t = new Topic();
    t.isPublished = published;
    return t;
  };

  it('returns [] when topics undefined', () => {
    const c = new Category();
    expect(c.getActiveTopics()).toEqual([]);
  });

  it('filters only published topics', () => {
    const c = new Category();
    c.topics = [buildTopic(true), buildTopic(false)];
    const actives = c.getActiveTopics();
    expect(actives.length).toBe(1);
    expect(actives[0].isPublished).toBe(true);
  });
});
