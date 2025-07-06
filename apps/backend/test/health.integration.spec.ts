import { INestApplication, CanActivate, ExecutionContext, Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request, { Response as SupertestResponse } from 'supertest'

// Ensure required env vars for Config validation
afterEach(() => {
  // jest resets env between tests within file, but keep global guarantee if needed
})
process.env.DATABASE_URL = process.env.DATABASE_URL || 'http://localhost'
import { AppModule } from '../src/app.module'
import { DataSource } from 'typeorm'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

class AllowHealthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    // allow /health, deny everything else
    return req.path === '/health'
  }
}

describe('Health Endpoint (integration)', () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Attach a guard that blocks everything except /health to ensure the endpoint is public
    app.useGlobalGuards(new AllowHealthGuard())

    await app.init()

    // Suppress expected Terminus error logs (database down scenarios)
    Logger.overrideLogger(false)
    jest.spyOn(Logger, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    dataSource = app.get(DataSource)
  })

  afterAll(async () => {
    await app?.close()
    ;(console.error as jest.Mock).mockRestore?.()
  })

  it('1) should return 200 with correct JSON structure when healthy', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Cache-Control', 'no-store')
      .expect((res: SupertestResponse) => {
        expect(res.body.status).toBe('ok')
        expect(res.body.info.database.status).toBe('up')
      })
  })

  it('2) HEAD request should return 200 and no body', async () => {
    await request(app.getHttpServer())
      .head('/health')
      .expect(200)
      .expect((res: SupertestResponse) => {
        // supertest returns `undefined` for HEAD body in some node versions
        expect(res.text === '' || res.text === undefined).toBe(true)
      })
  })

  it('3) Swagger spec should contain /health path', async () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('test').setVersion('1').build(),
    )

    expect(doc.paths).toHaveProperty('/health')
  })

  it('4) should return 503 when database connection is down', async () => {
    // Destroy connection
    await dataSource.destroy()

    await request(app.getHttpServer()).get('/health').expect(503)

    // Re-initialize connection for subsequent tests (optional)
    await dataSource.initialize()
  })
})
