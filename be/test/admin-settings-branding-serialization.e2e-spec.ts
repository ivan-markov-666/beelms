import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

describe('Admin Settings – branding serialization (e2e)', () => {
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

  it('PATCH /api/admin/settings persists nested branding social metadata fields', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-branding-serialization',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();

    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    // Ensure infraMonitoring is disabled to avoid validation blocking
    await request(app.getHttpServer())
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        features: {
          infraMonitoring: false,
        },
      })
      .expect(200);

    const getBefore = await request(app.getHttpServer())
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const beforeBody = getBefore.body as {
      branding: Record<string, unknown>;
    };

    const originalBranding = beforeBody.branding;

    const brandingUpdate = {
      socialDescription: 'Shared social description',
      socialImage: {
        imageUrl: '/branding/media/shared-social-test.png',
      },
      openGraph: {
        title: 'OG title',
        description: 'OG description',
        imageUrl: '/branding/media/open-graph-test.png',
      },
      twitter: {
        title: 'Twitter title',
        description: 'Twitter description',
        imageUrl: '/branding/media/twitter-test.png',
        card: 'player',
        app: {
          name: 'Bee App',
          id: {
            iphone: 'bee://iphone',
          },
        },
        player: {
          url: 'https://player.example/embed',
          width: 640,
          height: 360,
          stream: 'https://player.example/stream.m3u8',
          streamContentType: 'application/x-mpegURL',
        },
      },
    };

    try {
      const patchRes = await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ branding: brandingUpdate })
        .expect(200);

      const patchBody = patchRes.body as {
        branding: Record<string, unknown>;
      };

      expect(patchBody.branding).toMatchObject(brandingUpdate);

      const getAfter = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const afterBody = getAfter.body as {
        branding: Record<string, unknown>;
      };

      expect(afterBody.branding).toMatchObject(brandingUpdate);

      const publicRes = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const publicBody = publicRes.body as {
        branding: Record<string, unknown>;
      };

      expect(publicBody.branding).toMatchObject(brandingUpdate);
    } finally {
      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ branding: originalBranding })
        .expect(200);
    }
  });
});
