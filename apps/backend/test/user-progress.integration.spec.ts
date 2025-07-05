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

const ENTITIES = [
  User,
  Category,
  Course,
  Topic,
  UserProgress,
  UserCourseProgress,
  TestEntity,
  Question,
  SystemSetting,
]

describe('UserProgress & UserCourseProgress integration', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
      logging: false,
    })
    await dataSource.initialize()
  })

  afterAll(async () => {
    await dataSource.destroy()
  })

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.dropDatabase()
      await dataSource.synchronize()
    }
  })

  /* --------------------- Helper functions --------------------- */
  async function createTestUser(email = 'test@qa.local') {
    const user = dataSource.manager.create(User, {
      email,
      password: 'secret',
      role: UserRole.USER,
    })
    return dataSource.manager.save(user)
  }

  async function createTestCategory(name = 'QA') {
    const category = dataSource.manager.create(Category, { name })
    return dataSource.manager.save(category)
  }

  async function createTestCourse(category: Category, title = 'Course 1') {
    const course = dataSource.manager.create(Course, {
      title,
      description: 'desc',
      category,
    })
    return dataSource.manager.save(course)
  }

  async function createTestTopic(course: Course, title = 'Topic 1') {
    const topic = dataSource.manager.create(Topic, {
      title,
      content: 'content',
      course,
    })
    return dataSource.manager.save(topic)
  }

  /* ------------------------- Tests ---------------------------- */

  it('does not create duplicate user progress for same user & topic', async () => {
    const user = await createTestUser()
    const category = await createTestCategory()
    const course = await createTestCourse(category)
    const topic = await createTestTopic(course)

    // first record
    await dataSource.manager.save(
      dataSource.manager.create(UserProgress, {
        userId: user.id,
        topicId: topic.id,
      }),
    )

    // second save with same composite PK should perform UPDATE (no error) and leave count = 1
    await dataSource.manager.save(
      dataSource.manager.create(UserProgress, {
        userId: user.id,
        topicId: topic.id,
      }),
    )

    const count = await dataSource.manager.count(UserProgress, {
      where: { userId: user.id, topicId: topic.id },
    })
    expect(count).toBe(1)
  })

  it('cascades delete user progress when user is deleted', async () => {
    const user = await createTestUser()
    const category = await createTestCategory()
    const course = await createTestCourse(category)
    const topic = await createTestTopic(course)

    await dataSource.manager.save(
      dataSource.manager.create(UserProgress, {
        userId: user.id,
        topicId: topic.id,
      }),
    )

    // Ensure record exists
    expect(
      await dataSource.manager.count(UserProgress, {
        where: { userId: user.id },
      }),
    ).toBe(1)

    // Delete user (should cascade)
    await dataSource.manager.remove(user)

    expect(
      await dataSource.manager.count(UserProgress, {
        where: { userId: user.id },
      }),
    ).toBe(0)
  })

  it('requires mandatory fields in UserProgress', async () => {
    const progressMissingTopic = new UserProgress()
    progressMissingTopic.userId = 'some-user-id'

    // missing topicId
    await expect(dataSource.manager.save(progressMissingTopic)).rejects.toThrow()

    const progressMissingUser = new UserProgress()
    progressMissingUser.topicId = 'some-topic-id'

    // missing userId
    await expect(dataSource.manager.save(progressMissingUser)).rejects.toThrow()
  })

  it('handles bulk inserts correctly', async () => {
    const user = await createTestUser()
    const category = await createTestCategory()
    const course = await createTestCourse(category)

    const topics: Topic[] = []
    for (let i = 0; i < 100; i += 1) {
      const t = await createTestTopic(course, `Topic ${i}`)
      topics.push(t)
    }

    const progressRecords = topics.map((t) =>
      dataSource.manager.create(UserProgress, {
        userId: user.id,
        topicId: t.id,
      }),
    )

    await dataSource.manager.save(progressRecords)

    const count = await dataSource.manager.count(UserProgress, {
      where: { userId: user.id },
    })

    expect(count).toBe(100)
  })
})
