import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { CourseCurriculumItem } from '../src/courses/course-curriculum-item.entity';
import { Quiz } from '../src/assessments/quiz.entity';
import { QuizQuestion } from '../src/assessments/quiz-question.entity';
import { QuizOption } from '../src/assessments/quiz-option.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Assessments (Quizzes) endpoints (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let curriculumRepo: Repository<CourseCurriculumItem>;
  let quizRepo: Repository<Quiz>;
  let questionRepo: Repository<QuizQuestion>;
  let optionRepo: Repository<QuizOption>;

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
    curriculumRepo = app.get<Repository<CourseCurriculumItem>>(
      getRepositoryToken(CourseCurriculumItem),
    );
    quizRepo = app.get<Repository<Quiz>>(getRepositoryToken(Quiz));
    questionRepo = app.get<Repository<QuizQuestion>>(
      getRepositoryToken(QuizQuestion),
    );
    optionRepo = app.get<Repository<QuizOption>>(
      getRepositoryToken(QuizOption),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/courses/:courseId/quizzes/:quizId returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get(
        '/api/courses/00000000-0000-0000-0000-000000000000/quizzes/00000000-0000-0000-0000-000000000000',
      )
      .expect(401);
  });

  it('Enrolled user can load quiz and submit answers (score + passed)', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'assessments-admin');

    const adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }
    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Assessments course ${Date.now()}`,
        description: 'Course for quiz e2e',
        language: 'bg',
        status: 'active',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;

    const quiz = await quizRepo.save(
      quizRepo.create({ title: 'Demo quiz', passingScore: 1 }),
    );

    const question = await questionRepo.save(
      questionRepo.create({
        quizId: quiz.id,
        text: '2 + 2 = ?',
        order: 1,
      }),
    );

    await optionRepo.save([
      optionRepo.create({
        questionId: question.id,
        text: '3',
        optionIndex: 0,
        isCorrect: false,
      }),
      optionRepo.create({
        questionId: question.id,
        text: '4',
        optionIndex: 1,
        isCorrect: true,
      }),
    ]);

    await curriculumRepo.save(
      curriculumRepo.create({
        courseId,
        itemType: 'quiz',
        title: 'Quiz module',
        order: 1,
        wikiSlug: null,
        taskId: null,
        quizId: quiz.id,
      }),
    );

    const { accessToken: userToken } = await registerAndLogin(
      app,
      'assessments-user',
    );

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    const getRes = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/quizzes/${quiz.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const body = getRes.body as {
      id: string;
      title: string;
      passingScore: number | null;
      questions: Array<{ id: string; text: string; options: string[] }>;
    };

    expect(body.id).toBe(quiz.id);
    expect(body.questions.length).toBe(1);
    expect(body.questions[0].options).toEqual(['3', '4']);

    const submitRes = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/quizzes/${quiz.id}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        answers: [{ questionId: question.id, optionIndex: 1 }],
      })
      .expect(201);

    expect(submitRes.body).toEqual({ score: 1, maxScore: 1, passed: true });
  });

  it('Rejects submit with invalid questionId', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'assessments-invalid-qid-admin');

    const adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      throw new Error('Admin user not found after registerAndLogin');
    }
    adminUser.role = 'admin';
    await userRepo.save(adminUser);

    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Assessments invalid qid ${Date.now()}`,
        description: 'Course for invalid questionId',
        language: 'bg',
        status: 'active',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;

    const quiz = await quizRepo.save(
      quizRepo.create({ title: 'Invalid QID quiz', passingScore: 1 }),
    );

    await curriculumRepo.save(
      curriculumRepo.create({
        courseId,
        itemType: 'quiz',
        title: 'Quiz module',
        order: 1,
        wikiSlug: null,
        taskId: null,
        quizId: quiz.id,
      }),
    );

    const { accessToken: userToken } = await registerAndLogin(
      app,
      'assessments-invalid-qid-user',
    );

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/quizzes/${quiz.id}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        answers: [
          {
            questionId: '00000000-0000-0000-0000-000000000000',
            optionIndex: 0,
          },
        ],
      })
      .expect(400);
  });
});
