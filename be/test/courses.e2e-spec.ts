import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

type CourseSummary = {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
  categoryId: string | null;
  category: {
    slug: string;
    title: string;
  } | null;
};

type CourseDetail = CourseSummary & {
  curriculum: Array<{
    id: string;
    itemType: 'wiki' | 'task' | 'quiz';
    title: string;
    order: number;
    wikiSlug: string | null;
    taskId: string | null;
    quizId: string | null;
  }>;
};

describe('Courses public endpoints (e2e)', () => {
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

  it('GET /api/courses returns list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/courses')
      .expect(200);

    const body = res.body as CourseSummary[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);

    const first = body[0];
    expect(typeof first.id).toBe('string');
    expect(typeof first.title).toBe('string');
    expect(typeof first.description).toBe('string');
    expect(typeof first.language).toBe('string');
    expect(typeof first.status).toBe('string');
  });

  it('GET /api/courses/:courseId returns course detail', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/courses')
      .expect(200);
    const list = listRes.body as CourseSummary[];

    const target = list[0];

    const res = await request(app.getHttpServer())
      .get(`/api/courses/${target.id}`)
      .expect(200);

    const body = res.body as CourseDetail;
    expect(body.id).toBe(target.id);
    expect(body.title).toBe(target.title);
    expect(Array.isArray(body.curriculum)).toBe(true);
  });

  it('GET /api/courses/:courseId returns 404 for unknown courseId', async () => {
    await request(app.getHttpServer())
      .get('/api/courses/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
