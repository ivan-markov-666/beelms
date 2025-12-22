import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';
import { Task } from '../src/tasks/task.entity';
import { CourseCurriculumItem } from '../src/courses/course-curriculum-item.entity';

describe('Admin Tasks (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let taskRepo: Repository<Task>;
  let curriculumRepo: Repository<CourseCurriculumItem>;

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
    taskRepo = app.get<Repository<Task>>(getRepositoryToken(Task));
    curriculumRepo = app.get<Repository<CourseCurriculumItem>>(
      getRepositoryToken(CourseCurriculumItem),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const makeAdmin = async (emailLabel: string) => {
    const { email, accessToken } = await registerAndLogin(app, emailLabel);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw new Error('User not found');
    user.role = 'admin';
    await userRepo.save(user);
    return { token: accessToken };
  };

  it('Admin can CRUD tasks', async () => {
    const { token } = await makeAdmin('admin-tasks-crud');

    const createRes = await request(app.getHttpServer())
      .post('/api/admin/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin Task',
        description: 'Do something',
        language: 'bg',
        status: 'draft',
      })
      .expect(201);

    const taskId = (createRes.body as { id: string }).id;

    const listRes = await request(app.getHttpServer())
      .get('/api/admin/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = listRes.body as Array<{ id: string }>;
    expect(listBody.some((t) => t.id === taskId)).toBe(true);

    const getRes = await request(app.getHttpServer())
      .get(`/api/admin/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const getBody = getRes.body as { title: string; status: string };
    expect(getBody.title).toBe('Admin Task');
    expect(getBody.status).toBe('draft');

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/admin/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin Task Updated',
        status: 'active',
      })
      .expect(200);

    const updatedBody = updateRes.body as { title: string; status: string };
    expect(updatedBody.title).toBe('Admin Task Updated');
    expect(updatedBody.status).toBe('active');

    await request(app.getHttpServer())
      .delete(`/api/admin/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/admin/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('Curriculum refuses inactive taskId; learner can complete task item', async () => {
    const { token } = await makeAdmin('admin-task-curriculum');

    const task = await taskRepo.save(
      taskRepo.create({
        title: 'Inactive task',
        description: 'x',
        status: 'inactive',
        language: 'bg',
      }),
    );

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Course with task',
        description: 'desc',
        language: 'bg',
        status: 'active',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemType: 'task',
        title: 'Task item',
        order: 1,
        taskId: task.id,
      })
      .expect(400);

    task.status = 'active';
    await taskRepo.save(task);

    const curriculumRes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemType: 'task',
        title: 'Task item',
        order: 1,
        taskId: task.id,
      })
      .expect(201);

    const curriculumItemId = (curriculumRes.body as { id: string }).id;
    const saved = await curriculumRepo.findOne({
      where: { id: curriculumItemId },
    });
    expect(saved?.taskId).toBe(task.id);

    const { accessToken: learnerToken } = await registerAndLogin(
      app,
      'learner-task-complete',
    );

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(204);

    const progressBefore = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/curriculum/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200);

    const progressBodyBefore = progressBefore.body as {
      totalItems: number;
      completedItems: number;
      progressPercent: number;
      items: Array<{
        id: string;
        itemType: string;
        taskId: string | null;
        completed: boolean;
      }>;
    };

    expect(progressBodyBefore.totalItems).toBe(1);
    expect(progressBodyBefore.completedItems).toBe(0);

    const taskProgressItem = progressBodyBefore.items.find(
      (i) => i.itemType === 'task' && i.taskId === task.id,
    );
    expect(taskProgressItem?.id).toBe(curriculumItemId);
    expect(taskProgressItem?.completed).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/curriculum/${curriculumItemId}/complete`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(204);

    const progressAfter = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/curriculum/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .expect(200);

    const progressBodyAfter = progressAfter.body as {
      totalItems: number;
      completedItems: number;
      progressPercent: number;
      items: Array<{
        id: string;
        itemType: string;
        taskId: string | null;
        completed: boolean;
        completedAt: string | null;
      }>;
    };

    expect(progressBodyAfter.totalItems).toBe(1);
    expect(progressBodyAfter.completedItems).toBe(1);
    expect(progressBodyAfter.progressPercent).toBe(100);

    const completedItem = progressBodyAfter.items.find(
      (i) => i.id === curriculumItemId,
    );
    expect(completedItem?.completed).toBe(true);
    expect(typeof completedItem?.completedAt).toBe('string');
  });
});
