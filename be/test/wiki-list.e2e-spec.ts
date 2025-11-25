import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Wiki list endpoint (e2e)', () => {
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

  it('GET /api/wiki/articles returns active seeded articles', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    type WikiListItem = { slug: string };
    const body = res.body as WikiListItem[];
    const slugs = body.map((item) => item.slug);

    expect(slugs).toEqual(expect.arrayContaining(['getting-started', 'faq']));
  });
});
