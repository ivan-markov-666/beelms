import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { registerAndLogin } from './utils/auth-helpers';

describe('Wiki article feedback endpoints (e2e)', () => {
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

  async function getSummary(slug: string): Promise<{
    helpfulYes: number;
    helpfulNo: number;
    total: number;
  }> {
    const res = await request(app.getHttpServer())
      .get(`/api/wiki/articles/${slug}/feedback/summary`)
      .expect(200);

    return res.body as {
      helpfulYes: number;
      helpfulNo: number;
      total: number;
    };
  }

  it('GET /api/wiki/articles/:slug/feedback/summary returns counts', async () => {
    const summary = await getSummary('getting-started');

    expect(typeof summary.helpfulYes).toBe('number');
    expect(typeof summary.helpfulNo).toBe('number');
    expect(typeof summary.total).toBe('number');
    expect(summary.total).toBe(summary.helpfulYes + summary.helpfulNo);
  });

  it('POST /api/wiki/articles/:slug/feedback works for guests and increments totals', async () => {
    const before = await getSummary('getting-started');

    await request(app.getHttpServer())
      .post('/api/wiki/articles/getting-started/feedback')
      .send({ helpful: true })
      .expect(204);

    const after = await getSummary('getting-started');

    expect(after.total).toBe(before.total + 1);
    expect(after.helpfulYes).toBe(before.helpfulYes + 1);
    expect(after.helpfulNo).toBe(before.helpfulNo);
  });

  it('POST /api/wiki/articles/:slug/feedback upserts for logged-in user', async () => {
    const { accessToken } = await registerAndLogin(app, 'wiki-feedback');

    const before = await getSummary('getting-started');

    await request(app.getHttpServer())
      .post('/api/wiki/articles/getting-started/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ helpful: true })
      .expect(204);

    const afterFirst = await getSummary('getting-started');

    expect(afterFirst.total).toBe(before.total + 1);
    expect(afterFirst.helpfulYes).toBe(before.helpfulYes + 1);

    await request(app.getHttpServer())
      .post('/api/wiki/articles/getting-started/feedback')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ helpful: false })
      .expect(204);

    const afterSecond = await getSummary('getting-started');

    expect(afterSecond.total).toBe(afterFirst.total);
    expect(afterSecond.helpfulYes).toBe(afterFirst.helpfulYes - 1);
    expect(afterSecond.helpfulNo).toBe(afterFirst.helpfulNo + 1);
  });

  it('GET /api/wiki/articles/:slug/feedback/summary returns 404 for unknown slug', async () => {
    await request(app.getHttpServer())
      .get('/api/wiki/articles/unknown-slug/feedback/summary')
      .expect(404);
  });
});
