import { DataSource } from 'typeorm'

import { seedDatabase } from '../src/database/seeders'
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

describe('Database seeder integration', () => {
  let dataSource: DataSource

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        User,
        Category,
        Course,
        Topic,
        TestEntity,
        Question,
        UserProgress,
        UserCourseProgress,
        SystemSetting,
      ],
      synchronize: true,
      logging: false,
    })
    await dataSource.initialize()
  }, 60_000)

  afterAll(async () => {
    await dataSource.destroy()
  })

  it('creates categories and admin user', async () => {
    await seedDatabase(dataSource)

    const categoryCount = await dataSource.getRepository(Category).count()
    expect(categoryCount).toBeGreaterThan(0)

    const adminUser = await dataSource
      .getRepository(User)
      .findOneBy({ email: 'admin@example.com', role: UserRole.ADMIN })

    expect(adminUser).toBeTruthy()
  })

  it('is idempotent – subsequent runs do not create duplicates', async () => {
    const repoCategory = dataSource.getRepository(Category)
    const repoUser = dataSource.getRepository(User)

    const initialCategories = await repoCategory.count()
    const initialUsers = await repoUser.count()

    await seedDatabase(dataSource)

    expect(await repoCategory.count()).toBe(initialCategories)
    expect(await repoUser.count()).toBe(initialUsers)
  })

  it('creates expected number of records and ensures uniqueness', async () => {
    const categories = await dataSource.getRepository(Category).find()
    const users = await dataSource.getRepository(User).find()

    expect(categories.length).toBe(5)
    expect(users.length).toBe(11)

    const categoryNames = new Set(categories.map((c) => c.name))
    const userEmails = new Set(users.map((u) => u.email))

    expect(categoryNames.size).toBe(categories.length)
    expect(userEmails.size).toBe(users.length)
  })
})
