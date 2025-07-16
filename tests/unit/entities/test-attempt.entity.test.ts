import 'reflect-metadata';
import { validate } from 'class-validator';
import { TestAttempt } from '../../../packages/shared-types/src/entities/test-attempt.entity';
import { Test as TestEntity } from '../../../packages/shared-types/src/entities/test.entity';

describe('TestAttempt Entity', () => {
  const createValid = (): TestAttempt => {
    const a = new TestAttempt();
    a.testId = '123e4567-e89b-12d3-a456-426614174333';
    a.userId = '123e4567-e89b-12d3-a456-426614174444';
    a.attemptNumber = 1;
    a.scorePercentage = 65;
    a.passed = false;
    return a;
  };

  it('valid entity passes validation', async () => {
    const a = createValid();
    const errors = await validate(a);
    expect(errors.length).toBe(0);
  });

  it('invalid scorePercentage fails validation', async () => {
    const a = createValid();
    a.scorePercentage = -5;
    const errors = await validate(a);
    expect(errors.some((e) => e.property === 'scorePercentage')).toBe(true);
  });

  it('evaluatePass sets passed correctly for passing score', () => {
    const a = createValid();
    // Simulate loaded test entity
    const test60 = new TestEntity();
    test60.passingPercentage = 60;
    (a as unknown as { test: TestEntity }).test = test60;
    a.evaluatePass();
    expect(a.passed).toBe(true);
  });

  it('evaluatePass sets passed to false for failing score', () => {
    const a = createValid();
    const test80 = new TestEntity();
    test80.passingPercentage = 80;
    (a as unknown as { test: TestEntity }).test = test80;
    a.scorePercentage = 60;
    a.passed = true; // previous state
    a.evaluatePass();
    expect(a.passed).toBe(false);
  });

  it('evaluatePass does nothing when test is undefined', () => {
    const a = createValid();
    a.passed = false;
    a.evaluatePass();
    expect(a.passed).toBe(false);
  });
});
