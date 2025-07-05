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
  TestEntity,
  Question,
  UserProgress,
  UserCourseProgress,
  SystemSetting,
]

describe('Additional constraints, cascade & timestamp tests', () => {
  let ds: DataSource

  beforeAll(async () => {
    ds = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: true,
      logging: false,
    })
    await ds.initialize()
  })

  afterAll(async () => {
    await ds.destroy()
  })

  afterEach(async () => {
    if (ds.isInitialized) {
      await ds.dropDatabase()
      await ds.synchronize()
    }
  })

  /* Helper creators */
  const createUser = async (email = 'a@qa.local', role: UserRole = UserRole.USER) => {
    const u = ds.manager.create(User, { email, password: '123', role })
    return ds.manager.save(u)
  }

  const createCategory = async (name = 'QA') => {
    return ds.manager.save(ds.manager.create(Category, { name }))
  }

  const createCourse = async (cat: Category, title = 'Course') => {
    return ds.manager.save(ds.manager.create(Course, { title, description: 'd', category: cat }))
  }

  const createTopic = async (course: Course, title = 'Topic') => {
    return ds.manager.save(ds.manager.create(Topic, { title, content: 'c', course }))
  }

  const createHierarchy = async () => {
    const category = await createCategory()
    const course = await createCourse(category)
    const topic = await createTopic(course)
    const testEntity = await ds.manager.save(ds.manager.create(TestEntity, { title: 'T1', topic }))
    await ds.manager.save(
      ds.manager.create(Question, {
        text: 'Q',
        options: ['a', 'b'],
        correctAnswerIndex: 0,
        test: testEntity,
      }),
    )
    return { category, course, topic }
  }

  /* ---------------- Tests ---------------- */

  it('enforces unique constraint on User.email', async () => {
    await createUser('unique@qa.local')
    await expect(createUser('unique@qa.local')).rejects.toThrow()
  })

  it('enforces unique constraint on Category.name', async () => {
    await createCategory('UniqueCat')
    await expect(createCategory('UniqueCat')).rejects.toThrow()
  })

  it('enforces role check constraint', async () => {
    // Cast to bypass TS enum at compile time
    await expect(createUser('bad@qa.local', 'superadmin' as unknown as UserRole)).rejects.toThrow()
  })

  it('updates updatedAt on entity update', async () => {
    const user = await createUser('time@qa.local')
    const { createdAt, updatedAt } = user
    expect(updatedAt).toEqual(createdAt)

    // SQLite timestamps have second precision – wait 1.1s
    await new Promise((res) => setTimeout(res, 1100))
    user.password = '456'
    const saved = await ds.manager.save(user)

    expect(saved.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime())
  })

  it('cascades deletion from Category down to Questions and progress records', async () => {
    const { category, course, topic } = await createHierarchy()
    const user = await createUser('cascade@qa.local')

    // create progress records
    await ds.manager.save(ds.manager.create(UserProgress, { userId: user.id, topicId: topic.id }))
    await ds.manager.save(
      ds.manager.create(UserCourseProgress, {
        userId: user.id,
        courseId: course.id,
        completedTopics: 0,
        totalTopics: 1,
      }),
    )

    // Delete Category
    await ds.manager.remove(category)

    // Expect cascaded deletes
    const counts = await Promise.all([
      ds.manager.count(Course),
      ds.manager.count(Topic),
      ds.manager.count(TestEntity),
      ds.manager.count(Question),
      ds.manager.count(UserProgress),
      ds.manager.count(UserCourseProgress),
    ])

    counts.forEach((c) => expect(c).toBe(0))
  })
})
