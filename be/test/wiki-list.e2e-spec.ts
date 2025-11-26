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

  it('GET /api/wiki/articles?lang=bg filters by language', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles?lang=bg')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    type WikiListItem = { slug: string; language: string };
    const body = res.body as WikiListItem[];

    expect(body.length).toBeGreaterThanOrEqual(1);
    for (const item of body) {
      expect(item.language).toBe('bg');
    }
  });

  it('GET /api/wiki/articles?q=Начало filters by search query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles?q=Начало')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    type WikiListItem = { slug: string; title: string };
    const body = res.body as WikiListItem[];

    expect(body.length).toBe(1);
    expect(body[0].slug).toBe('getting-started');
  });
});
