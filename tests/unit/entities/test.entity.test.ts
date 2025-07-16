import 'reflect-metadata';
import { validate } from 'class-validator';
import { Test as TestEntity } from '../../../packages/shared-types/src/entities/test.entity';

describe('Test Entity', () => {
  const createValidTest = (): TestEntity => {
    const t = new TestEntity();
    t.topicId = '123e4567-e89b-12d3-a456-426614174000';
    t.title = 'Sample Test';
    t.passingPercentage = 60;
    t.maxAttempts = 5;
    t.isActive = true;
    return t;
  };

  it('validates a correct test entity', async () => {
    const t = createValidTest();
    const errors = await validate(t);
    expect(errors.length).toBe(0);
  });

  it('fails validation for invalid passingPercentage', async () => {
    const t = createValidTest();
    t.passingPercentage = 120;
    const errors = await validate(t);
    expect(errors.some((e) => e.property === 'passingPercentage')).toBe(true);
  });

  it('isPassed() helper works', () => {
    const t = createValidTest();
    t.passingPercentage = 70;
    expect(t.isPassed(80)).toBe(true);
    expect(t.isPassed(70)).toBe(true);
    expect(t.isPassed(69.9)).toBe(false);
  });
});
