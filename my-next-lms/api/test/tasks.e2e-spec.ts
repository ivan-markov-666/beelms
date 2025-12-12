import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
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

  it('GET /api/tasks/string-hello-world returns task definition', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tasks/string-hello-world')
      .expect(200);

    expect(res.body).toMatchObject({
      id: 'string-hello-world',
      type: 'string_match',
    });
  });

  it('GET /api/tasks/unknown-task returns 404', async () => {
    await request(app.getHttpServer())
      .get('/api/tasks/unknown-task')
      .expect(404);
  });

  it('POST /api/tasks/string-hello-world/submit returns passed=true for correct solution', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks/string-hello-world/submit')
      .send({ solution: 'hello world' })
      .expect(200);

    const body = res.body as { passed: boolean; score: number };

    expect(body.passed).toBe(true);
    expect(body.score).toBe(1);
  });

  it('POST /api/tasks/string-hello-world/submit returns passed=false for incorrect solution', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks/string-hello-world/submit')
      .send({ solution: 'something else' })
      .expect(200);

    const body = res.body as { passed: boolean; score: number };

    expect(body.passed).toBe(false);
    expect(body.score).toBe(0);
  });

  it('POST /api/tasks/string-hello-world/submit returns 400 when solution is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks/string-hello-world/submit')
      .send({})
      .expect(400);
  });
});
