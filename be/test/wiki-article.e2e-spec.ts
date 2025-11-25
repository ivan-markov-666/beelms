import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Wiki article endpoint (e2e)', () => {
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

  it('GET /api/wiki/articles/getting-started?lang=bg returns BG version', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles/getting-started')
      .query({ lang: 'bg' })
      .expect(200);

    type WikiArticle = {
      slug: string;
      language: string;
      title: string;
      status: string;
    };

    const body = res.body as WikiArticle;

    expect(body.slug).toBe('getting-started');
    expect(body.language).toBe('bg');
    expect(body.title).toBe('Начало с QA4Free');
    expect(body.status).toBe('active');
  });

  it('GET /api/wiki/articles/getting-started?lang=en returns EN version', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/wiki/articles/getting-started')
      .query({ lang: 'en' })
      .expect(200);

    type WikiArticle = {
      slug: string;
      language: string;
      title: string;
      status: string;
    };

    const body = res.body as WikiArticle;

    expect(body.slug).toBe('getting-started');
    expect(body.language).toBe('en');
    expect(body.title).toBe('Getting started with QA4Free');
    expect(body.status).toBe('active');
  });

  it('GET /api/wiki/articles/unknown-slug returns 404', async () => {
    await request(app.getHttpServer())
      .get('/api/wiki/articles/unknown-slug')
      .expect(404);
  });

  it('GET /api/wiki/articles/faq?lang=en returns 404 when language version is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/wiki/articles/faq')
      .query({ lang: 'en' })
      .expect(404);
  });
});
