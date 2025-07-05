import { DataSource } from 'typeorm'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers'

/**
 * Integration test that starts a disposable PostgreSQL container,
 * runs *all* TypeORM migrations and verifies that core tables exist.
 *
 * This mirrors the CI smoke-test step but gives developers the
 * confidence to run it locally with `pnpm test`.
 */
describe('Database migrations', () => {
  jest.setTimeout(120_000)
  let container: StartedPostgreSqlContainer
  let dataSource: DataSource

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15')
      .withUsername('test')
      .withPassword('test')
      .withDatabase('testdb')
      .start()

    const url = container.getConnectionUri()

    dataSource = new DataSource({
      type: 'postgres',
      url,
      synchronize: false,
      logging: false,
      entities: [], // not needed for migrations
      migrations: [__dirname + '/../src/database/migrations/*.{ts,js}'],
    })

    await dataSource.initialize()
  })

  afterAll(async () => {
    if (dataSource) await dataSource.destroy()
    if (container) await container.stop()
  })

  it('runs all migrations successfully and creates core tables', async () => {
    const migrations = await dataSource.runMigrations()
    expect(migrations.length).toBeGreaterThan(0)

    const [{ exists }] = await dataSource.query(
      `SELECT to_regclass('public.category') IS NOT NULL AS exists`,
    )
    expect(exists).toBe(true)
  })
})
