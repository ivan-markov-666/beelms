import 'reflect-metadata';
import { validate } from 'class-validator';
import { QuestionOption } from '../../../packages/shared-types/src/entities/question-option.entity';

const QUESTION_ID = '123e4567-e89b-12d3-a456-426614174002';

describe('QuestionOption Entity', () => {
  const createValid = (): QuestionOption => {
    const o = new QuestionOption();
    o.questionId = QUESTION_ID;
    o.optionText = '4';
    o.isCorrect = true;
    o.sortOrder = 0;
    return o;
  };

  it('validates correct option', async () => {
    const opt = createValid();
    const errors = await validate(opt);
    expect(errors.length).toBe(0);
  });

  it('detects empty option text', async () => {
    const opt = createValid();
    opt.optionText = '';
    const errors = await validate(opt);
    expect(errors.some((e) => e.property === 'optionText')).toBe(true);
  });
});
