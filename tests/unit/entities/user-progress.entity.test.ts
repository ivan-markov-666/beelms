import 'reflect-metadata';
import { validate } from 'class-validator';
import { UserProgress } from '../../../packages/shared-types/src/entities/user-progress.entity';

describe('UserProgress Entity', () => {
  const createValid = (): UserProgress => {
    const p = new UserProgress();
    p.userId = '123e4567-e89b-12d3-a456-426614174111';
    p.topicId = '123e4567-e89b-12d3-a456-426614174222';
    p.progressPercent = 75;
    return p;
  };

  it('valid entity passes validation', async () => {
    const p = createValid();
    const errors = await validate(p);
    expect(errors.length).toBe(0);
  });

  it('invalid progressPercent fails validation', async () => {
    const p = createValid();
    p.progressPercent = 110;
    const errors = await validate(p);
    expect(errors.some((e) => e.property === 'progressPercent')).toBe(true);
  });

  it('isCompleted returns correct value', () => {
    const p = createValid();
    expect(p.isCompleted()).toBe(false);
    p.progressPercent = 100;
    expect(p.isCompleted()).toBe(true);
  });
});
