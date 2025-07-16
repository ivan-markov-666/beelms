import { DataSource } from 'typeorm';
import { createInMemoryDataSource } from '../../helpers/create-in-memory-datasource';
import { User } from '../../../packages/shared-types/src/entities/user.entity';
import { Topic } from '../../../packages/shared-types/src/entities/topic.entity';
import { Category } from '../../../packages/shared-types/src/entities/category.entity';
import { UserProgress } from '../../../packages/shared-types/src/entities/user-progress.entity';
import { Test } from '../../../packages/shared-types/src/entities/test.entity';
import { TestAttempt } from '../../../packages/shared-types/src/entities/test-attempt.entity';

/**
 * Integration tests that cover cascade deletes and progress tracking logic
 */
describe('Progress tracking & cascade deletes', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = await createInMemoryDataSource();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('deleting User cascades UserProgress and TestAttempt rows', async () => {
    const userRepo = ds.getRepository(User);
    const catRepo = ds.getRepository(Category);
    const topicRepo = ds.getRepository(Topic);
    const progressRepo = ds.getRepository(UserProgress);
    const testRepo = ds.getRepository(Test);
    const attemptRepo = ds.getRepository(TestAttempt);

    // create category / topic / test
    const cat = await catRepo.save(catRepo.create({ name: 'Cat', colorCode: '#ff0', iconName: 'tag', sortOrder: 1 }));
    const topic = await topicRepo.save(
      topicRepo.create({
        categoryId: cat.id,
        topicNumber: 1,
        name: 'Topic',
        slug: 'topic',
        estimatedReadingTime: 2,
      })
    );

    const test = await testRepo.save(
      testRepo.create({ topicId: topic.id, title: 'Test 1', passingPercentage: 70, maxAttempts: 3 })
    );

    // create user
    const user = await userRepo.save(
      userRepo.create({ email: 'u@example.com', username: 'user', passwordHash: 'hash' })
    );

    // progress
    await progressRepo.save(progressRepo.create({ userId: user.id, topicId: topic.id, progressPercent: 50 }));

    // attempt
    await attemptRepo.save(
      attemptRepo.create({ userId: user.id, testId: test.id, attemptNumber: 1, scorePercentage: 80 })
    );

    expect(await progressRepo.count()).toBe(1);
    expect(await attemptRepo.count()).toBe(1);

    // delete user => cascades
    await userRepo.delete({ id: user.id });

    expect(await progressRepo.count()).toBe(0);
    expect(await attemptRepo.count()).toBe(0);
  });

  it('UserProgress.isCompleted helper', async () => {
    const progress = new UserProgress();
    progress.progressPercent = 100;
    expect(progress.isCompleted()).toBe(true);
    progress.progressPercent = 99;
    expect(progress.isCompleted()).toBe(false);
  });

  it('TestAttempt.evaluatePass helper uses Test.passingPercentage', async () => {
    const attempt = new TestAttempt();
    attempt.scorePercentage = 65;
    const test = new Test();
    test.passingPercentage = 60;
    attempt.test = test;
    attempt.evaluatePass();
    expect(attempt.passed).toBe(true);
  });
});
