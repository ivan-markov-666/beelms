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

  it('GET /api/wiki/articles supports basic pagination', async () => {
    const resPage1 = await request(app.getHttpServer())
      .get('/api/wiki/articles?page=1&pageSize=1')
      .expect(200);

    const resPage2 = await request(app.getHttpServer())
      .get('/api/wiki/articles?page=2&pageSize=1')
      .expect(200);

    type WikiListItem = { slug: string };
    const page1 = resPage1.body as WikiListItem[];
    const page2 = resPage2.body as WikiListItem[];

    expect(page1.length).toBeLessThanOrEqual(1);
    expect(page2.length).toBeLessThanOrEqual(1);

    const allSlugs = [...page1, ...page2].map((item) => item.slug);

    expect(allSlugs.length).toBeGreaterThanOrEqual(1);

    const uniqueSlugs = new Set(allSlugs);
    expect(uniqueSlugs.size).toBe(allSlugs.length);
  });

  it('GET /api/wiki/articles returns empty array for out-of-range page', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles?page=999&pageSize=10')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
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
