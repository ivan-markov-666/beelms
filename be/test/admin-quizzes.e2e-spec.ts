import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';
import { Quiz } from '../src/assessments/quiz.entity';
import { CourseCurriculumItem } from '../src/courses/course-curriculum-item.entity';

describe('Admin Quizzes (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let quizRepo: Repository<Quiz>;
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
    quizRepo = app.get<Repository<Quiz>>(getRepositoryToken(Quiz));
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

  it('Admin can CRUD quizzes and questions', async () => {
    const { token } = await makeAdmin('admin-quizzes-crud');

    // Create quiz
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/quizzes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin Quiz',
        description: 'Desc',
        language: 'bg',
        status: 'draft',
        passingScore: 1,
      })
      .expect(201);

    const quizId = (createRes.body as { id: string }).id;

    // Add question
    const addQuestionRes = await request(app.getHttpServer())
      .post(`/api/admin/quizzes/${quizId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Capital of BG?',
        options: ['Plovdiv', 'Sofia'],
        correctOptionIndex: 1,
      })
      .expect(201);

    const quizAfterQuestion = addQuestionRes.body as {
      questions: Array<{ id: string; text: string; options: string[] }>;
    };
    const questionId = quizAfterQuestion.questions[0].id;

    // Update question
    await request(app.getHttpServer())
      .patch(`/api/admin/quizzes/${quizId}/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Capital of Bulgaria?',
        options: ['Varna', 'Sofia'],
        correctOptionIndex: 1,
        order: 1,
      })
      .expect(200);

    // Get quiz
    const getRes = await request(app.getHttpServer())
      .get(`/api/admin/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const quizBody = getRes.body as {
      id: string;
      status: string;
      questions: Array<{
        text: string;
        options: string[];
        correctOptionIndex: number;
      }>;
    };

    expect(quizBody.questions[0].text).toContain('Bulgaria');
    expect(quizBody.questions[0].options).toEqual(['Varna', 'Sofia']);
    expect(quizBody.questions[0].correctOptionIndex).toBe(1);

    // Delete question
    await request(app.getHttpServer())
      .delete(`/api/admin/quizzes/${quizId}/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // Delete quiz
    await request(app.getHttpServer())
      .delete(`/api/admin/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('Curriculum refuses inactive quizId', async () => {
    const { token } = await makeAdmin('admin-curriculum-quiz');

    // Create quiz and set inactive
    const quiz = await quizRepo.save(
      quizRepo.create({
        title: 'Inactive quiz',
        status: 'inactive',
        language: 'bg',
      }),
    );

    // Create course
    const createCourseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Course with quiz',
        description: 'desc',
        language: 'bg',
        status: 'active',
        isPaid: false,
      })
      .expect(201);

    const courseId = (createCourseRes.body as { id: string }).id;

    // Try to add curriculum item with inactive quiz
    await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemType: 'quiz',
        title: 'Quiz item',
        order: 1,
        quizId: quiz.id,
      })
      .expect(400);

    // Activate quiz and retry
    quiz.status = 'active';
    await quizRepo.save(quiz);

    const curriculumRes = await request(app.getHttpServer())
      .post(`/api/admin/courses/${courseId}/curriculum`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemType: 'quiz',
        title: 'Quiz item',
        order: 1,
        quizId: quiz.id,
      })
      .expect(201);

    const curriculumItemId = (curriculumRes.body as { id: string }).id;
    const saved = await curriculumRepo.findOne({
      where: { id: curriculumItemId },
    });
    expect(saved?.quizId).toBe(quiz.id);
  });
});
