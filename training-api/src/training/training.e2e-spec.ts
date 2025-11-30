import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('Training API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/training');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/training/ping returns pong', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/training/ping')
      .expect(200);

    expect(res.body).toHaveProperty('message', 'pong');
  });

  it('POST /api/training/echo echoes the value on success', async () => {
    const payload = { value: 'test123' };

    const res = await request(app.getHttpServer())
      .post('/api/training/echo')
      .send(payload)
      .expect(200);

    expect(res.body).toHaveProperty('value', payload.value);
    expect(typeof res.body.receivedAt).toBe('string');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('POST /api/training/echo returns 400 for missing value', async () => {
    await request(app.getHttpServer())
      .post('/api/training/echo')
      .send({})
      .expect(400);
  });
});
