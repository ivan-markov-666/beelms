import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbTestModule } from '../db-test.module';

// Импортируем все необходимые энтити
import { User, UserRole } from '../../entities/user.entity';
import { Category } from '../../entities/category.entity';
import { Topic } from '../../entities/topic.entity';
import { TopicContent, LanguageCode } from '../../entities/topic-content.entity';
import { Test as TestEntity } from '../../entities/test.entity';
import { Question, QuestionType } from '../../entities/question.entity';
import { Answer } from '../../entities/answer.entity';
import { UserProgress } from '../../entities/user-progress.entity';
import { TestAttempt } from '../../entities/test-attempt.entity';

describe('Entity Relations', () => {
  let module: TestingModule;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let topicRepository: Repository<Topic>;
  let topicContentRepository: Repository<TopicContent>;
  let testRepository: Repository<TestEntity>;
  let questionRepository: Repository<Question>;
  let answerRepository: Repository<Answer>;
  let userProgressRepository: Repository<UserProgress>;
  let testAttemptRepository: Repository<TestAttempt>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DbTestModule],
    }).compile();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    topicRepository = module.get<Repository<Topic>>(getRepositoryToken(Topic));
    topicContentRepository = module.get<Repository<TopicContent>>(getRepositoryToken(TopicContent));
    testRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    answerRepository = module.get<Repository<Answer>>(getRepositoryToken(Answer));
    userProgressRepository = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
    testAttemptRepository = module.get<Repository<TestAttempt>>(getRepositoryToken(TestAttempt));
  });

  afterAll(async () => {
    await module.close();
  });

  // Тест за правилно моделиране на релациите между таблиците
  it('should create related entities and load them correctly', async () => {
    // Създаваме потребител
    const user = new User();
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.passwordHash = 'hashedpassword';
    user.role = UserRole.USER;
    await userRepository.save(user);

    // Създаваме категория
    const category = new Category();
    category.name = 'Test Category';
    category.description = 'A test category';
    category.colorCode = '#1976d2';
    category.iconName = 'book';
    await categoryRepository.save(category);

    // Създаваме тема към категорията
    const topic = new Topic();
    topic.name = 'Test Topic';
    topic.slug = 'test-topic';
    topic.categoryId = category.id;
    topic.createdById = user.id;
    topic.topicNumber = 1;
    topic.isPublished = true;
    await topicRepository.save(topic);

    // Създаваме съдържание към темата
    const content = new TopicContent();
    content.topicId = topic.id;
    content.languageCode = LanguageCode.EN;
    content.title = 'Test Content';
    content.content = 'This is test content';
    await topicContentRepository.save(content);

    // Създаваме тест към темата
    const test = new TestEntity();
    test.topicId = topic.id;
    test.title = 'Test Quiz';
    test.passingPercentage = 70;
    test.maxAttempts = 3;
    await testRepository.save(test);

    // Създаваме въпрос към теста
    const question = new Question();
    question.testId = test.id;
    question.questionText = 'What is TypeORM?';
    question.questionType = QuestionType.MULTIPLE;

    question.sortOrder = 1;
    await questionRepository.save(question);

    // Създаваме отговори към въпроса
    const answer1 = new Answer();
    answer1.questionId = question.id;
    answer1.answerText = 'A JavaScript library';
    answer1.isCorrect = false;
    answer1.sortOrder = 1;
    await answerRepository.save(answer1);

    const answer2 = new Answer();
    answer2.questionId = question.id;
    answer2.answerText = 'An ORM for TypeScript and JavaScript';
    answer2.isCorrect = true;
    answer2.sortOrder = 2;
    await answerRepository.save(answer2);

    // Създаваме UserProgress запис
    const progress = new UserProgress();
    progress.userId = user.id;
    progress.topicId = topic.id;
    progress.isCompleted = false;
    progress.progressData = { lastPosition: 0.5, lastVisited: new Date().toISOString() };
    await userProgressRepository.save(progress);

    // Създаваме TestAttempt запис
    const attempt = new TestAttempt();
    attempt.userId = user.id;
    attempt.testId = test.id;
    attempt.score = 0;
    attempt.passed = false;
    attempt.attemptNumber = 1;
    attempt.answersData = { [question.id]: answer2.id };
    attempt.startedAt = new Date();
    await testAttemptRepository.save(attempt);

    // Тестваме зареждането на релациите
    const foundTopic = await topicRepository.findOne({
      where: { id: topic.id },
      relations: ['category', 'content', 'test'],
    });

    expect(foundTopic).toBeDefined();
    expect(foundTopic?.category).toBeDefined();
    expect(foundTopic?.category.id).toBe(category.id);
    expect(foundTopic?.content).toBeDefined();
    expect(foundTopic?.content.length).toBe(1);
    expect(foundTopic?.test).toBeDefined();
    expect(foundTopic?.test.id).toBe(test.id);

    // Тестваме зареждането на въпроси и отговори
    const foundTest = await testRepository.findOne({
      where: { id: test.id },
      relations: ['questions', 'questions.answers'],
    });

    expect(foundTest).toBeDefined();
    expect(foundTest?.questions).toBeDefined();
    expect(foundTest?.questions.length).toBe(1);
    expect(foundTest?.questions[0].answers).toBeDefined();
    expect(foundTest?.questions[0].answers.length).toBe(2);

    // Тестваме дали UserProgress записът е правилен
    const foundProgress = await userProgressRepository.findOne({
      where: { userId: user.id, topicId: topic.id },
    });

    expect(foundProgress).toBeDefined();
    expect(foundProgress?.progressData).toBeDefined();
    expect(foundProgress?.progressData?.lastPosition).toBe(0.5);

    // Тестваме дали TestAttempt записът е правилен
    const foundAttempt = await testAttemptRepository.findOne({
      where: { userId: user.id, testId: test.id },
    });

    expect(foundAttempt).toBeDefined();
    expect(foundAttempt?.answersData).toBeDefined();
    if (foundAttempt?.answersData) {
      expect(Object.keys(foundAttempt.answersData).length).toBe(1);
      expect(foundAttempt.answersData[question.id]).toBe(answer2.id);
    }
  });
});
