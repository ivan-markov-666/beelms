import { DataSource } from 'typeorm'
import { randomUUID } from 'crypto'
import {
  User,
  Category,
  Course,
  Topic,
  Test as TestEntity,
  Question,
  UserProgress,
  UserCourseProgress,
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
]

describe('Edge-case integration tests (Task 1.2.1)', () => {
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

  /* Helpers */
  const createUser = async () =>
    ds.manager.save(ds.manager.create(User, { email: `${randomUUID()}@qa.local`, password: 'x' }))

  const createHierarchy = async () => {
    const category = await ds.manager.save(
      ds.manager.create(Category, { name: `Cat-${randomUUID()}` }),
    )
    const course = await ds.manager.save(
      ds.manager.create(Course, { title: 'T', description: 'd', category }),
    )
    const topic = await ds.manager.save(
      ds.manager.create(Topic, { title: 'L', content: 'c', course }),
    )
    const test = await ds.manager.save(ds.manager.create(TestEntity, { title: 'Quiz', topic }))
    return { category, course, topic, test }
  }

  /* ---------------- Tests ---------------- */

  it('updates Topic.content and bumps updatedAt', async () => {
    const { topic } = await createHierarchy()
    const firstUpdated = topic.updatedAt

    // wait >1s to overcome SQLite second precision
    await new Promise((r) => setTimeout(r, 1100))

    topic.content = '## New content'
    const saved = await ds.manager.save(topic)
    expect(saved.content).toBe('## New content')
    expect(saved.updatedAt.getTime()).toBeGreaterThan(firstUpdated.getTime())
  })

  it('sets default values on UserCourseProgress & UserProgress', async () => {
    const { course, topic } = await createHierarchy()
    const user = await createUser()

    const ucp = await ds.manager.save(
      ds.manager.create(UserCourseProgress, {
        userId: user.id,
        courseId: course.id,
        totalTopics: 1,
      }),
    )
    expect(ucp.progressPercentage).toBe(0)

    const up = await ds.manager.save(
      ds.manager.create(UserProgress, { userId: user.id, topicId: topic.id }),
    )
    expect(up.completedAt).toBeInstanceOf(Date)
  })

  it('rejects Question referencing non-existent Test (FK violation)', async () => {
    await expect(
      ds.manager.save(
        ds.manager.create(Question, {
          text: 'Invalid',
          options: ['a'],
          correctAnswerIndex: 0,
          // fake relation via foreign key property
          test: { id: randomUUID() } as unknown as TestEntity,
        }),
      ),
    ).rejects.toThrow()
  })

  it('rejects UserProgress for non-existent Topic', async () => {
    const user = await createUser()
    await expect(
      ds.manager.save(ds.manager.create(UserProgress, { userId: user.id, topicId: randomUUID() })),
    ).rejects.toThrow()
  })

  it('allows re-creation of UserProgress after delete with same composite key', async () => {
    const { topic } = await createHierarchy()
    const user = await createUser()

    const upRepo = ds.getRepository(UserProgress)
    await upRepo.save(upRepo.create({ userId: user.id, topicId: topic.id }))
    await upRepo.delete({ userId: user.id, topicId: topic.id })
    await upRepo.save(upRepo.create({ userId: user.id, topicId: topic.id }))

    const count = await upRepo.count({ where: { userId: user.id, topicId: topic.id } })
    expect(count).toBe(1)
  })
})
