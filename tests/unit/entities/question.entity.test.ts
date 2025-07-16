import 'reflect-metadata';
import { validate } from 'class-validator';
import { Question } from '../../../packages/shared-types/src/entities/question.entity';
import { QuestionType } from '../../../packages/shared-types/src/enums/question-type.enum';

const TEST_ID = '123e4567-e89b-12d3-a456-426614174001';

describe('Question Entity', () => {
  const createValid = (): Question => {
    const q = new Question();
    q.testId = TEST_ID;
    q.questionType = QuestionType.SINGLE;
    q.questionText = 'What is 2 + 2?';
    q.sortOrder = 1;
    return q;
  };

  it('validates a proper question', async () => {
    const q = createValid();
    const errors = await validate(q);
    expect(errors.length).toBe(0);
  });

  it('detects missing questionText', async () => {
    const q = createValid();
    q.questionText = '';
    const errors = await validate(q);
    expect(errors.some((e) => e.property === 'questionText')).toBe(true);
  });

  it('detects invalid enum', async () => {
    const q = createValid();
    // @ts-expect-error – assigning invalid enum
    q.questionType = 'invalid';
    const errors = await validate(q);
    expect(errors.some((e) => e.property === 'questionType')).toBe(true);
  });
});
