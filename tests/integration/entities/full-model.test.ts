import { DataSource } from 'typeorm';
import { createInMemoryDataSource } from '../../helpers/create-in-memory-datasource';
import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { TopicContent } from '../../../packages/shared-types/src/entities/topic-content.entity';
import { User } from '../../../packages/shared-types/src/entities/user.entity';
import { Test } from '../../../packages/shared-types/src/entities/test.entity';
import { Question } from '../../../packages/shared-types/src/entities/question.entity';
import { QuestionType } from '../../../packages/shared-types/src/enums/question-type.enum';
import { QuestionOption } from '../../../packages/shared-types/src/entities/question-option.entity';
import { UserProgress } from '../../../packages/shared-types/src/entities/user-progress.entity';
import { TestAttempt } from '../../../packages/shared-types/src/entities/test-attempt.entity';

/**
 * Smoke-style integration covering entire data model working together
 */
describe('Full data model smoke integration', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = await createInMemoryDataSource();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('creates linked records across the whole model', async () => {
    const userRepo = ds.getRepository(User);
    const catRepo = ds.getRepository(Category);
    const topicRepo = ds.getRepository(Topic);
    const contentRepo = ds.getRepository(TopicContent);
    const testRepo = ds.getRepository(Test);
    const questionRepo = ds.getRepository(Question);
    const optionRepo = ds.getRepository(QuestionOption);
    const progressRepo = ds.getRepository(UserProgress);
    const attemptRepo = ds.getRepository(TestAttempt);

    const user = await userRepo.save(
      userRepo.create({ email: 'full@example.com', username: 'full', passwordHash: 'hash' })
    );

    const cat = await catRepo.save(
      catRepo.create({ name: 'All', colorCode: '#123456', iconName: 'layers', sortOrder: 1 })
    );

    const topic = await topicRepo.save(
      topicRepo.create({
        categoryId: cat.id,
        topicNumber: 1,
        name: 'Everything',
        slug: 'everything',
        estimatedReadingTime: 10,
        createdById: user.id,
      })
    );

    await contentRepo.save(contentRepo.create({ topicId: topic.id, languageCode: 'bg', content: 'Всичко' }));

    const test = await testRepo.save(
      testRepo.create({ topicId: topic.id, title: 'T', passingPercentage: 50, maxAttempts: 3 })
    );

    const questionEntity = questionRepo.create({
      testId: test.id,
      questionType: QuestionType.SINGLE,
      questionText: 'What?',
      sortOrder: 1,
    });
    const question = await questionRepo.save(questionEntity);

    await optionRepo.save(
      optionRepo.create({ questionId: question.id, optionText: 'A', isCorrect: true, sortOrder: 1 })
    );

    await progressRepo.save(progressRepo.create({ userId: user.id, topicId: topic.id, progressPercent: 100 }));

    await attemptRepo.save(
      attemptRepo.create({ userId: user.id, testId: test.id, attemptNumber: 1, scorePercentage: 55, passed: true })
    );

    // Load user with relations tree
    const loaded = await userRepo.findOne({
      where: { id: user.id },
      relations: {
        createdTopics: true,
        progresses: true,
        testAttempts: true,
      },
    });

    expect(loaded?.createdTopics.length).toBe(1);
    expect(loaded?.progresses.length).toBe(1);
    expect(loaded?.testAttempts.length).toBe(1);
  });
});
