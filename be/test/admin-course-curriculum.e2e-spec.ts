import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { Course } from '../src/courses/course.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CurriculumItem = {
  id: string;
  itemType: 'wiki' | 'task' | 'quiz';
  title: string;
  order: number;
  wikiSlug: string | null;
  taskId: string | null;
  quizId: string | null;
};

describe('Admin Course Curriculum endpoints (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;

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
    courseRepo = app.get<Repository<Course>>(getRepositoryToken(Course));
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/admin/courses/:id/curriculum returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/courses/00000000-0000-0000-0000-000000000000/curriculum')
      .expect(401);
  });

  it('GET /api/admin/courses/:id/curriculum returns 403 for non-admin user', async () => {
    const { accessToken } = await registerAndLogin(
      app,
      'admin-course-curriculum-list-non-admin',
    );

    const course = await courseRepo.findOne({ where: { status: 'active' } });
    expect(course).toBeDefined();

    if (!course) {
      throw new Error('No course found to run curriculum test');
    }

    await request(app.getHttpServer())
      .get(`/api/admin/courses/${course.id}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('Admin can add/move/update/delete curriculum items (wiki) and ordering is stable', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-course-curriculum-crud-admin',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Curriculum Course',
        description: 'Course for curriculum e2e',
        language: 'bg',
        status: 'draft',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;
    expect(courseId).toBeDefined();

    // Insert first item at order 1
    const itemARes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemType: 'wiki',
        title: 'Intro A',
        order: 1,
        wikiSlug: 'getting-started',
      })
      .expect(201);

    const itemA = itemARes.body as CurriculumItem;
    expect(itemA.order).toBe(1);

    // Insert second item also at order 1 -> should push itemA to order 2
    const itemBRes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemType: 'wiki',
        title: 'Intro B',
        order: 1,
        wikiSlug: 'getting-started',
      })
      .expect(201);

    const itemB = itemBRes.body as CurriculumItem;
    expect(itemB.order).toBe(1);

    const list1Res = await request(app.getHttpServer())
      .get(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const list1 = list1Res.body as CurriculumItem[];
    expect(list1.map((i) => i.title)).toEqual(['Intro B', 'Intro A']);
    expect(list1.map((i) => i.order)).toEqual([1, 2]);

    // Move itemA from 2 -> 1 (should push itemB to 2)
    const moveRes = await request(app.getHttpServer())
      .patch(`/api/admin/courses/${courseId}/curriculum/${itemA.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ order: 1 })
      .expect(200);

    const moved = moveRes.body as CurriculumItem;
    expect(moved.id).toBe(itemA.id);
    expect(moved.order).toBe(1);

    const list2Res = await request(app.getHttpServer())
      .get(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const list2 = list2Res.body as CurriculumItem[];
    expect(list2.map((i) => i.title)).toEqual(['Intro A', 'Intro B']);
    expect(list2.map((i) => i.order)).toEqual([1, 2]);

    // Update title of itemA
    const updateTitleRes = await request(app.getHttpServer())
      .patch(`/api/admin/courses/${courseId}/curriculum/${itemA.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Intro A Updated' })
      .expect(200);

    const updated = updateTitleRes.body as CurriculumItem;
    expect(updated.title).toBe('Intro A Updated');

    // Delete itemA, itemB should shift to order 1
    await request(app.getHttpServer())
      .delete(`/api/admin/courses/${courseId}/curriculum/${itemA.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const list3Res = await request(app.getHttpServer())
      .get(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const list3 = list3Res.body as CurriculumItem[];
    expect(list3.length).toBe(1);
    expect(list3[0].id).toBe(itemB.id);
    expect(list3[0].order).toBe(1);
  });

  it('Admin can reference course_only wiki articles in course curriculum, but invalid wikiSlug is rejected', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-course-curriculum-course-only-wiki',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const slug = `course-only-curriculum-${Date.now()}`;

    await request(app.getHttpServer())
      .post('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug,
        status: 'active',
        visibility: 'course_only',
        tags: ['course'],
        contents: [
          {
            language: 'bg',
            title: 'Course only article',
            content: 'Visible only in course curriculum',
          },
        ],
      })
      .expect(201);

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Course Only Wiki Curriculum Course',
        description: 'Course for course_only wiki curriculum validation',
        language: 'bg',
        status: 'draft',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;
    expect(courseId).toBeDefined();

    const okRes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemType: 'wiki',
        title: 'Course-only module',
        order: 1,
        wikiSlug: slug,
      })
      .expect(201);

    const okItem = okRes.body as CurriculumItem;
    expect(okItem.itemType).toBe('wiki');
    expect(okItem.wikiSlug).toBe(slug);

    const badRes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemType: 'wiki',
        title: 'Invalid slug module',
        order: 2,
        wikiSlug: `does-not-exist-${Date.now()}`,
      })
      .expect(400);

    const badBody = badRes.body as { message?: string };
    expect(badBody.message).toBe('Invalid wikiSlug');
  });

  it('Rejects wiki curriculum items when the wiki article has no published version for the course language', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-course-curriculum-missing-translation',
    );

    const adminUser = await userRepo.findOne({ where: { email } });
    expect(adminUser).toBeDefined();

    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }

    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const slug = `missing-translation-${Date.now()}`;

    // Create wiki article with ONLY bg content
    await request(app.getHttpServer())
      .post('/api/admin/wiki/articles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        slug,
        status: 'active',
        visibility: 'course_only',
        tags: ['course'],
        contents: [
          {
            language: 'bg',
            title: 'BG only article',
            content: 'No EN translation',
          },
        ],
      })
      .expect(201);

    // Create EN course
    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'EN Course Missing Translation',
        description: 'Course for missing wiki translation validation',
        language: 'en',
        status: 'draft',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;
    expect(courseId).toBeDefined();

    const res = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        itemType: 'wiki',
        title: 'Should fail due to missing EN',
        order: 1,
        wikiSlug: slug,
      })
      .expect(400);

    const body = res.body as { message?: string };
    expect(body.message).toBe(
      'Wiki article has no published version for course language',
    );
  });
});
