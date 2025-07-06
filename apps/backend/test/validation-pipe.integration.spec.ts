import request from 'supertest'
// Ensure required env vars are present for the Nest application bootstrapped in this test
// Provide a minimal but valid URI so that Joi validation passes.
// We are not connecting to a real database in this test, so the exact value is irrelevant
// as long as it is a syntactically valid URI.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'http://localhost'

import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'

describe('Global ValidationPipe (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false },
      }),
    )
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 400 Bad Request for invalid DTO', async () => {
    await request(app.getHttpServer()).post('/test-dto').send({ email: 'invalid' }).expect(400)
  })
})
