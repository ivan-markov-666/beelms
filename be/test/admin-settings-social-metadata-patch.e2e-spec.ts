import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Admin Settings controller PATCH (e2e) – social metadata', () => {
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

  it('accepts valid branding social metadata payload and returns persisted state', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-patch-social-valid',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const beforeRes = await request(app.getHttpServer())
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const originalBranding = (beforeRes.body as { branding: unknown }).branding;

    const brandingUpdate = {
      socialDescription: 'Shared desc',
      socialImage: { imageUrl: '/branding/media/shared.png' },
      openGraph: {
        title: 'OG title',
        description: 'OG desc',
        imageUrl: '/branding/media/og.png',
      },
      twitter: {
        card: 'app',
        title: 'Tw title',
        description: 'Tw desc',
        imageUrl: '/branding/media/tw.png',
        app: {
          name: 'Bee App',
          id: { iphone: 'bee://iphone' },
          url: { iphone: 'https://example.com/iphone' },
        },
      },
    };

    try {
      const patchRes = await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ branding: brandingUpdate })
        .expect(200);

      const patchBody = patchRes.body as { branding: unknown };
      expect(patchBody.branding).toMatchObject(brandingUpdate);

      const afterRes = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const afterBody = afterRes.body as { branding: unknown };
      expect(afterBody.branding).toMatchObject(brandingUpdate);
    } finally {
      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ branding: originalBranding })
        .expect(200);
    }
  });

  it('rejects twitter card=app when required app fields are missing (ValidationPipe + nested DTO validation)', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-patch-social-invalid-app',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        branding: {
          twitter: {
            card: 'app',
            app: {
              name: 'Bee App',
              id: {
                iphone: '',
              },
            },
          },
        },
      })
      .expect(400);
  });

  it('rejects non-whitelisted fields (forbidNonWhitelisted)', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-patch-social-nonwhitelist',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    await request(app.getHttpServer())
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        branding: {
          twitter: {
            title: 'ok',
          },
          someUnknownField: 'nope',
        },
      })
      .expect(400);
  });
});
