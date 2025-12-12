import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Training API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/training/ping returns ok status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/training/ping')
      .expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /api/training/echo returns echoed body', async () => {
    const payload = { message: 'hello', count: 3 };

    const res = await request(app.getHttpServer())
      .post('/api/training/echo')
      .send(payload)
      .expect(200);

    expect(res.body).toEqual(payload);
  });

  it('POST /api/training/echo returns 400 for invalid JSON body', async () => {
    await request(app.getHttpServer())
      .post('/api/training/echo')
      .set('Content-Type', 'application/json')
      // invalid JSON string – should be rejected by the JSON body parser
      .send('{"message": "hello", invalid}')
      .expect(400);
  });
});
