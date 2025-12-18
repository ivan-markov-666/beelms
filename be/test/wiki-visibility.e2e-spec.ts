import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Wiki visibility (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

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

    userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  it('course_only articles are not accessible via public wiki endpoints', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'wiki-visibility-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const slug = `course-only-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug,
        status: 'active',
        visibility: 'course_only',
        tags: ['course', 'paid'],
        contents: [
          {
            language: 'bg',
            title: 'Само за курс',
            content: 'Съдържание, видимо само в курс',
          },
        ],
      })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/wiki/articles')
      .expect(200);

    type WikiListItem = { slug: string };
    const slugs = (listRes.body as WikiListItem[]).map((i) => i.slug);
    expect(slugs).not.toContain(slug);

    await request(app.getHttpServer())
      .get(`/api/wiki/articles/${slug}`)
      .query({ lang: 'bg' })
      .expect(404);

    const adminDetailRes = await request(app.getHttpServer())
      .get(`/api/admin/wiki/articles/by-slug/${slug}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ lang: 'bg' })
      .expect(200);

    type AdminWikiDetail = {
      slug: string;
      visibility?: string;
      tags?: string[];
      status: string;
    };

    const adminBody = adminDetailRes.body as AdminWikiDetail;
    expect(adminBody.slug).toBe(slug);
    expect(adminBody.status).toBe('active');
    expect(adminBody.visibility).toBe('course_only');
    expect(adminBody.tags).toEqual(expect.arrayContaining(['course', 'paid']));
  });
});
