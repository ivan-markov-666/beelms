import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbTestModule } from '../db-test.module';

// Импортируем все необходимые энтити
import { TopicContent, LanguageCode } from '../../entities/topic-content.entity';
import { UserProgress } from '../../entities/user-progress.entity';
import { TestAttempt } from '../../entities/test-attempt.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Test as TestEntity } from '../../entities/test.entity';

describe('SQLite Compatibility', () => {
  let module: TestingModule;
  let topicContentRepository: Repository<TopicContent>;
  let userProgressRepository: Repository<UserProgress>;
  let testAttemptRepository: Repository<TestAttempt>;
  let userRepository: Repository<User>;
  let testRepository: Repository<TestEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DbTestModule],
    }).compile();

    topicContentRepository = module.get<Repository<TopicContent>>(getRepositoryToken(TopicContent));
    userProgressRepository = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
    testAttemptRepository = module.get<Repository<TestAttempt>>(getRepositoryToken(TestAttempt));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    testRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
  });

  afterAll(async () => {
    await module.close();
  });

  it('should use datetime type for timestamp columns', () => {
    // Проверяваме базовите timestamp полета във всички ентити
    const entities = [
      userRepository.metadata,
      testRepository.metadata,
      topicContentRepository.metadata,
      userProgressRepository.metadata,
      testAttemptRepository.metadata,
    ];

    for (const entity of entities) {
      const createdAtColumn = entity.findColumnWithPropertyName('createdAt');
      const updatedAtColumn = entity.findColumnWithPropertyName('updatedAt');

      expect(createdAtColumn?.type).toBe('datetime');
      expect(updatedAtColumn?.type).toBe('datetime');
    }
  });

  it('should handle JSON columns with simple-json type', async () => {
    // Проверка за правилния тип на JSON колоните в UserProgress
    const progressColumn = userProgressRepository.metadata.findColumnWithPropertyName('progressData');
    expect(progressColumn?.type).toBe('simple-json');

    // Проверка за правилния тип на JSON колоните в TestAttempt
    const answersDataColumn = testAttemptRepository.metadata.findColumnWithPropertyName('answersData');
    expect(answersDataColumn?.type).toBe('simple-json');

    // Проверка дали можем успешно да записваме и четем JSON данни
    const user = new User();
    user.email = 'json-test@example.com';
    user.username = 'jsontest';
    user.passwordHash = 'hashedpassword';
    user.role = UserRole.USER;
    await userRepository.save(user);

    const userProgress = new UserProgress();
    userProgress.userId = user.id;
    userProgress.topicId = '00000000-0000-0000-0000-000000000000'; // dummy ID
    userProgress.isCompleted = true;
    userProgress.completedAt = new Date();
    userProgress.progressData = {
      lastPosition: 0.75,
      checkpoints: [
        { id: 'cp1', completed: true },
        { id: 'cp2', completed: false },
      ],
    };

    await userProgressRepository.save(userProgress);

    const savedUserProgress = await userProgressRepository.findOne({
      where: { id: userProgress.id },
    });

    expect(savedUserProgress).toBeDefined();
    expect(savedUserProgress?.progressData).toBeDefined();
    expect(savedUserProgress?.progressData?.lastPosition).toBe(0.75);
    expect(savedUserProgress?.progressData?.checkpoints).toHaveLength(2);
    expect(savedUserProgress?.progressData?.checkpoints[0].id).toBe('cp1');
    expect(savedUserProgress?.progressData?.checkpoints[0].completed).toBe(true);
  });

  it('should handle enum values as varchar with constraints', async () => {
    // Проверка за правилното съхранение на enum стойностите

    // Проверка за User.role
    const user1 = new User();
    user1.email = 'role-test-user@example.com';
    user1.username = 'roleuser';
    user1.passwordHash = 'hashedpassword';
    user1.role = UserRole.USER;
    await userRepository.save(user1);

    const user2 = new User();
    user2.email = 'role-test-admin@example.com';
    user2.username = 'roleadmin';
    user2.passwordHash = 'hashedpassword';
    user2.role = UserRole.ADMIN;
    await userRepository.save(user2);

    const savedUser1 = await userRepository.findOne({ where: { id: user1.id } });
    const savedUser2 = await userRepository.findOne({ where: { id: user2.id } });

    expect(savedUser1?.role).toBe(UserRole.USER);
    expect(savedUser2?.role).toBe(UserRole.ADMIN);

    // Проверка за TopicContent.languageCode
    const topicContent1 = new TopicContent();
    topicContent1.topicId = '00000000-0000-0000-0000-000000000000'; // dummy ID
    topicContent1.title = 'Test BG';
    topicContent1.content = 'Content BG';
    topicContent1.languageCode = LanguageCode.BG;
    await topicContentRepository.save(topicContent1);

    const topicContent2 = new TopicContent();
    topicContent2.topicId = '00000000-0000-0000-0000-000000000001'; // another dummy ID
    topicContent2.title = 'Test EN';
    topicContent2.content = 'Content EN';
    topicContent2.languageCode = LanguageCode.EN;
    await topicContentRepository.save(topicContent2);

    const savedContent1 = await topicContentRepository.findOne({
      where: { id: topicContent1.id },
    });
    const savedContent2 = await topicContentRepository.findOne({
      where: { id: topicContent2.id },
    });

    expect(savedContent1?.languageCode).toBe(LanguageCode.BG);
    expect(savedContent2?.languageCode).toBe(LanguageCode.EN);
  });
});
