import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { CoursePurchase } from '../src/courses/course-purchase.entity';
import { CourseEnrollment } from '../src/courses/course-enrollment.entity';
import { registerAndLogin } from './utils/auth-helpers';

type CreatedCourse = {
  id: string;
  status: string;
  isPaid: boolean;
  currency: string | null;
  priceCents: number | null;
};

describe('Admin Course grants (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let purchaseRepo: Repository<CoursePurchase>;
  let enrollmentRepo: Repository<CourseEnrollment>;

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
    purchaseRepo = app.get<Repository<CoursePurchase>>(
      getRepositoryToken(CoursePurchase),
    );
    enrollmentRepo = app.get<Repository<CourseEnrollment>>(
      getRepositoryToken(CourseEnrollment),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const makeAdmin = async (email: string) => {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }
    user.role = 'admin';
    await userRepo.save(user);
  };

  const createPaidCourseAsAdmin = async (adminToken: string) => {
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Paid course ${Date.now()}`,
        description: 'Paid course for admin grant tests',
        language: 'bg',
        status: 'active',
        isPaid: true,
        currency: 'eur',
        priceCents: 999,
      })
      .expect(201);

    return createRes.body as CreatedCourse;
  };

  it('POST /api/admin/courses/:courseId/grants creates purchase + enrollment (idempotent)', async () => {
    const { email: adminEmail, accessToken: adminToken } =
      await registerAndLogin(app, 'admin-grant-admin');
    await makeAdmin(adminEmail);

    const admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const course = await createPaidCourseAsAdmin(adminToken);

    const { email: buyerEmail, accessToken: buyerToken } =
      await registerAndLogin(app, 'admin-grant-buyer');

    const buyer = await userRepo.findOne({ where: { email: buyerEmail } });
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/admin/courses/${course.id}/grants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: buyer.id, grantReason: 'manual-grant-test' })
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/admin/courses/${course.id}/grants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: buyer.id })
      .expect(204);

    await request(app.getHttpServer())
      .post(`/api/courses/${course.id}/enroll`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(204);

    const purchases = await purchaseRepo.find({
      where: { userId: buyer.id, courseId: course.id },
    });
    expect(purchases.length).toBe(1);
    expect(purchases[0].source).toBe('admin');
    expect(purchases[0].grantedByUserId).toBe(admin.id);
    expect(purchases[0].grantReason).toBe('manual-grant-test');

    const enrollments = await enrollmentRepo.find({
      where: { userId: buyer.id, courseId: course.id },
    });
    expect(enrollments.length).toBe(1);
  });
});
