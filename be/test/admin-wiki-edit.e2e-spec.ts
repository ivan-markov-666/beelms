import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { WikiArticle } from '../src/wiki/wiki-article.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Admin Wiki edit endpoint (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let articleRepo: Repository<WikiArticle>;

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
    articleRepo = app.get<Repository<WikiArticle>>(
      getRepositoryToken(WikiArticle),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT /api/admin/wiki/articles/:id updates article for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-edit-admin',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const article = await articleRepo.findOne({
      where: { slug: 'getting-started' },
    });
    expect(article).toBeDefined();

    if (!article) {
      throw new Error('Article "getting-started" not found in seed data');
    }

    const res = await request(app.getHttpServer())
      .put(`/api/admin/wiki/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'bg',
        title: 'Начало с QA4Free (admin редакция)',
        content: 'Обновено съдържание от администратор',
        status: 'active',
      })
      .expect(200);

    type WikiArticleResponse = {
      id: string;
      slug: string;
      language: string;
      title: string;
      content: string;
      status: string;
      updatedAt: string;
    };

    const body = res.body as WikiArticleResponse;

    expect(body.id).toBe(article.id);
    expect(body.slug).toBe('getting-started');
    expect(body.language).toBe('bg');
    expect(body.title).toBe('Начало с QA4Free (admin редакция)');
    expect(body.content).toBe('Обновено съдържание от администратор');
    expect(body.status).toBe('active');
    expect(typeof body.updatedAt).toBe('string');
  });

  it('PUT /api/admin/wiki/articles/:id returns 401 without token', async () => {
    await request(app.getHttpServer())
      .put('/api/admin/wiki/articles/some-id')
      .send({
        language: 'bg',
        title: 't',
        content: 'c',
        status: 'draft',
      })
      .expect(401);
  });

  it('PUT /api/admin/wiki/articles/:id returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-wiki-edit-non-admin',
    );

    const article = await articleRepo.findOne({
      where: { slug: 'getting-started' },
    });
    expect(article).toBeDefined();

    if (!article) {
      throw new Error('Article "getting-started" not found in seed data');
    }

    await request(app.getHttpServer())
      .put(`/api/admin/wiki/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'bg',
        title: 't',
        content: 'c',
        status: 'draft',
      })
      .expect(403);
  });

  it('PUT /api/admin/wiki/articles/:id returns 404 for non-existing article', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-edit-404',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .put('/api/admin/wiki/articles/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'bg',
        title: 't',
        content: 'c',
        status: 'draft',
      })
      .expect(404);
  });

  it('PUT /api/admin/wiki/articles/:id returns 400 for invalid body', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-edit-400',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const article = await articleRepo.findOne({
      where: { slug: 'getting-started' },
    });
    expect(article).toBeDefined();

    if (!article) {
      throw new Error('Article "getting-started" not found in seed data');
    }

    await request(app.getHttpServer())
      .put(`/api/admin/wiki/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'bg',
        // missing title should trigger validation error (400)
        content: 'c',
        status: 'active',
      })
      .expect(400);
  });
});
