import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { WikiArticle } from '../src/wiki/wiki-article.entity';
import { registerAndLogin } from './utils/auth-helpers';

interface AdminWikiArticleVersionResponse {
  id: string;
  version: number;
  language: string;
  title: string;
  createdAt: string;
  createdBy: string | null;
}

interface WikiArticleResponse {
  id: string;
  slug: string;
  language: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
}

describe('Admin Wiki versions endpoints (e2e)', () => {
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

  it('GET /api/admin/wiki/articles/:id/versions returns list for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-list-admin',
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
      .get(`/api/admin/wiki/articles/${article.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as AdminWikiArticleVersionResponse[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const first = body[0];
    expect(typeof first.id).toBe('string');
    expect(typeof first.version).toBe('number');
    expect(typeof first.language).toBe('string');
    expect(typeof first.title).toBe('string');
    expect(typeof first.createdAt).toBe('string');
  });

  it('GET /api/admin/wiki/articles/:id/versions returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/wiki/articles/some-id/versions')
      .expect(401);
  });

  it('GET /api/admin/wiki/articles/:id/versions returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-list-non-admin',
    );

    const article = await articleRepo.findOne({
      where: { slug: 'getting-started' },
    });
    expect(article).toBeDefined();

    if (!article) {
      throw new Error('Article "getting-started" not found in seed data');
    }

    await request(app.getHttpServer())
      .get(`/api/admin/wiki/articles/${article.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /api/admin/wiki/articles/:id/versions returns 404 for non-existing article', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-list-404',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .get(
        '/api/admin/wiki/articles/00000000-0000-0000-0000-000000000000/versions',
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('POST /api/admin/wiki/articles/:id/versions/:versionId/restore restores version for admin user', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-restore-admin',
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

    const versionsRes = await request(app.getHttpServer())
      .get(`/api/admin/wiki/articles/${article.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const versions = versionsRes.body as AdminWikiArticleVersionResponse[];
    expect(versions.length).toBeGreaterThan(0);

    const targetVersion = versions[0];

    const res = await request(app.getHttpServer())
      .post(
        `/api/admin/wiki/articles/${article.id}/versions/${targetVersion.id}/restore`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as WikiArticleResponse;

    expect(body.id).toBe(article.id);
    expect(body.slug).toBe(article.slug);
    expect(body.language).toBe(targetVersion.language);
    expect(body.title).toBe(targetVersion.title);
    expect(typeof body.content).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  it('POST /api/admin/wiki/articles/:id/versions/:versionId/restore returns 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/wiki/articles/some-id/versions/some-version/restore')
      .expect(401);
  });

  it('POST /api/admin/wiki/articles/:id/versions/:versionId/restore returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-restore-non-admin',
    );

    const article = await articleRepo.findOne({
      where: { slug: 'getting-started' },
    });
    expect(article).toBeDefined();

    if (!article) {
      throw new Error('Article "getting-started" not found in seed data');
    }

    await request(app.getHttpServer())
      .post(
        `/api/admin/wiki/articles/${article.id}/versions/some-version-id/restore`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('POST /api/admin/wiki/articles/:id/versions/:versionId/restore returns 404 for non-existing article', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-restore-404-article',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .post(
        '/api/admin/wiki/articles/00000000-0000-0000-0000-000000000000/versions/some-version-id/restore',
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('POST /api/admin/wiki/articles/:id/versions/:versionId/restore returns 404 for non-existing version', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-restore-404-version',
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
      .post(
        `/api/admin/wiki/articles/${article.id}/versions/00000000-0000-0000-0000-000000000001/restore`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('DELETE /api/admin/wiki/articles/:id/versions/:versionId returns 400 when trying to delete the current version for a language', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-wiki-versions-delete-current-400',
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

    const updatedTitle = `Admin updated title ${Date.now()}`;
    const updatedContent = `Admin updated content ${Date.now()}`;

    await request(app.getHttpServer())
      .put(`/api/admin/wiki/articles/${article.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'bg',
        title: updatedTitle,
        content: updatedContent,
        status: 'active',
      })
      .expect(200);

    const versionsRes = await request(app.getHttpServer())
      .get(`/api/admin/wiki/articles/${article.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const versions = versionsRes.body as AdminWikiArticleVersionResponse[];
    const bgVersions = versions.filter((v) => v.language === 'bg');
    expect(bgVersions.length).toBeGreaterThanOrEqual(2);

    const latestBg = bgVersions.reduce((latest, current) =>
      current.version > latest.version ? current : latest,
    );

    await request(app.getHttpServer())
      .delete(`/api/admin/wiki/articles/${article.id}/versions/${latestBg.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
