import { DataSource, QueryRunner } from 'typeorm'
import { randomUUID } from 'crypto'
import {
  Category,
  Course,
  Topic,
  Test as TestEntity,
  Question,
  User,
  UserProgress,
  UserCourseProgress,
  SystemSetting,
} from '../src/entities'

const ENTITIES = [
  Category,
  Course,
  Topic,
  TestEntity,
  Question,
  User,
  UserProgress,
  UserCourseProgress,
  SystemSetting,
]

describe('Additional coverage for Task 1.2.1', () => {
  let ds: DataSource
  let qr: QueryRunner

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

  /* util creators */
  const createHierarchy = async () => {
    const cat = await ds.getRepository(Category).save({ name: `Cat-${randomUUID()}` })
    const course = await ds
      .getRepository(Course)
      .save({ title: 'C', description: 'd', category: cat })
    const topic = await ds.getRepository(Topic).save({ title: 'T', content: '#', course })
    const test = await ds.getRepository(TestEntity).save({ title: 'quiz', topic })
    const question = await ds.getRepository(Question).save({
      text: 'Q',
      options: ['a', 'b'],
      correctAnswerIndex: 0,
      test,
    })
    return { cat, course, topic, test, question }
  }

  it('deleting Course cascades removal of dependent entities', async () => {
    const { course } = await createHierarchy()

    // delete course
    await ds.getRepository(Course).delete(course.id)

    // expect topics/tests/questions deleted
    const topicCnt = await ds.getRepository(Topic).count()
    const testCnt = await ds.getRepository(TestEntity).count()
    const questionCnt = await ds.getRepository(Question).count()
    expect(topicCnt).toBe(0)
    expect(testCnt).toBe(0)
    expect(questionCnt).toBe(0)
  })

  it('UserCourseProgress duplicate composite key triggers update not insert', async () => {
    const { course } = await createHierarchy()
    const user = await ds
      .getRepository(User)
      .save({ email: `${randomUUID()}@qa.local`, password: 'x' })
    const repo = ds.getRepository(UserCourseProgress)
    await repo.save({ userId: user.id, courseId: course.id, totalTopics: 4 })
    await repo.save({ userId: user.id, courseId: course.id, totalTopics: 4, completedTopics: 2 })
    const all = await repo.find()
    expect(all.length).toBe(1)
    expect(all[0].completedTopics).toBe(2)
  })

  it('SystemSetting duplicates act as update and updatedAt changes', async () => {
    const repo = ds.getRepository(SystemSetting)
    await repo.save({ key: 'theme', value: 'light' })
    const first = await repo.findOneByOrFail({ key: 'theme' })
    await new Promise((r) => setTimeout(r, 1100))
    await repo.save({ key: 'theme', value: 'dark' })
    const second = await repo.findOneByOrFail({ key: 'theme' })
    expect(second.value).toBe('dark')
    expect(second.updatedAt.getTime()).toBeGreaterThan(first.updatedAt.getTime())
  })

  it('SystemSetting accepts large value payload', async () => {
    const bigValue = 'x'.repeat(20 * 1024) // 20 KB
    const setting = await ds.getRepository(SystemSetting).save({ key: 'big', value: bigValue })
    expect(setting.value.length).toBe(20 * 1024)
  })

  it('Question.options serialized/deserialized correctly and rejects undefined', async () => {
    const { test } = await createHierarchy()
    const repo = ds.getRepository(Question)
    const saved = await repo.save({
      text: 'Sel',
      options: ['x', 'y', 'z'],
      correctAnswerIndex: 1,
      test,
    })
    const reloaded = await repo.findOneByOrFail({ id: saved.id })
    expect(reloaded.options).toEqual(['x', 'y', 'z'])

    await expect(
      repo.save({
        text: 'err',
        options: undefined as unknown as string[],
        correctAnswerIndex: 0,
        test,
      }),
    ).rejects.toThrow()
  })

  it('creating Topic with invalid course FK fails', async () => {
    await expect(
      ds
        .getRepository(Topic)
        .save({ title: 'bad', content: '-', course: { id: randomUUID() } as Course }),
    ).rejects.toThrow()
  })

  it('rolls back transaction on error', async () => {
    qr = ds.createQueryRunner()
    await qr.startTransaction()
    try {
      await qr.manager.save(Category, { name: 'tmp' })
      throw new Error('abort')
    } catch (e) {
      await qr.rollbackTransaction()
    } finally {
      await qr.release()
    }
    const cnt = await ds.getRepository(Category).count()
    expect(cnt).toBe(0)
  })
})
