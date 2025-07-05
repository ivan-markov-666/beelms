import { DataSource } from 'typeorm'

import {
  User,
  Category,
  Course,
  Topic,
  Test as TestEntity,
  Question,
  UserProgress,
  UserCourseProgress,
  SystemSetting,
  UserRole,
} from '../src/entities'

// Utility to gather all entity classes in one place
const ENTITIES = [
  User,
  Category,
  Course,
  Topic,
  TestEntity,
  Question,
  UserProgress,
  UserCourseProgress,
  SystemSetting,
]

describe('TypeORM entities integration', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true, // ok for tests
      logging: false,
    })
    await dataSource.initialize()
  }, 60_000)

  afterAll(async () => {
    await dataSource.destroy()
  })

  it('persists and retrieves entities & relations correctly', async () => {
    // Create hierarchy: Category -> Course -> Topic -> Test -> Question
    const category = dataSource.manager.create(Category, { name: 'QA' })
    await dataSource.manager.save(category)

    const course = dataSource.manager.create(Course, {
      title: 'Intro to QA',
      description: 'Basics',
      category,
    })
    await dataSource.manager.save(course)

    const topic = dataSource.manager.create(Topic, {
      title: 'Testing types',
      content: '# Markdown',
      course,
    })
    await dataSource.manager.save(topic)

    const testEntity = dataSource.manager.create(TestEntity, {
      title: 'Quiz 1',
      topic,
    })
    await dataSource.manager.save(testEntity)

    const question = dataSource.manager.create(Question, {
      text: 'What is unit testing?',
      options: ['Option A', 'Option B'],
      correctAnswerIndex: 0,
      test: testEntity,
    })
    await dataSource.manager.save(question)

    // Create User
    const user = dataSource.manager.create(User, {
      email: 'user@example.com',
      password: 'hashed',
      role: UserRole.USER,
    })
    await dataSource.manager.save(user)

    // Mark topic as completed
    const progress = dataSource.manager.create(UserProgress, {
      user,
      topic,
    })
    await dataSource.manager.save(progress)

    // Update course progress
    const courseProgress = dataSource.manager.create(UserCourseProgress, {
      user,
      course,
      completedTopics: 1,
      totalTopics: 1,
      progressPercentage: 100,
    })
    await dataSource.manager.save(courseProgress)

    // System setting
    const setting = dataSource.manager.create(SystemSetting, {
      key: 'EMAIL_DAILY_LIMIT',
      value: '100',
      description: 'Max emails per day',
    })
    await dataSource.manager.save(setting)

    /* Assertions */
    const savedCourse = await dataSource.getRepository(Course).findOne({
      where: { id: course.id },
      relations: {
        category: true,
        topics: {
          test: {
            questions: true,
          },
        },
      },
    })
    expect(savedCourse?.category.name).toBe('QA')
    expect(savedCourse?.topics[0].test.questions.length).toBe(1)

    const savedProgress = await dataSource
      .getRepository(UserProgress)
      .findOne({ where: { userId: user.id, topicId: topic.id } })
    expect(savedProgress).toBeTruthy()

    const savedSetting = await dataSource
      .getRepository(SystemSetting)
      .findOneBy({ key: 'EMAIL_DAILY_LIMIT' })
    expect(savedSetting?.value).toBe('100')
  }, 60_000)
})
