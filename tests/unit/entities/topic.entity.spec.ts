import 'reflect-metadata';
import { validate } from 'class-validator';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { Category } from '../../../packages/shared-types/src/entities/category.entity';

describe('Topic Entity', () => {
  const createValidTopic = (): Topic => {
    const topic = new Topic();

    topic.category = new Category();
    topic.categoryId = '123e4567-e89b-12d3-a456-426614174000';
    topic.topicNumber = 1;
    topic.name = 'Variables and Data Types';
    topic.slug = 'variables-and-data-types';
    topic.estimatedReadingTime = 5;
    topic.isPublished = true;
    return topic;
  };

  it('validates a correct topic', async () => {
    const topic = createValidTopic();
    const errors = await validate(topic);
    expect(errors.length).toBe(0);
  });

  it('detects invalid slug', async () => {
    const topic = createValidTopic();
    topic.slug = 'Invalid Slug!';
    const errors = await validate(topic);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });
});
