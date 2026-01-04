import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstanceConfig } from '../src/settings/instance-config.entity';
import { Repository } from 'typeorm';
import request from 'supertest';
import { registerAndLogin } from './utils/auth-helpers';
import { User } from '../src/auth/user.entity';

type PublicSettingsBody = {
  branding: {
    socialImage?: unknown;
    socialDescription?: unknown;
    openGraph?: unknown;
    twitter?: unknown;
  };
  features?: unknown;
  languages?: unknown;
  socialCredentials?: unknown;
  stripe?: unknown;
};

describe('Public Settings Endpoint - Social Metadata (e2e)', () => {
  let app: INestApplication;
  let settingsRepository: Repository<InstanceConfig>;
  let userRepository: Repository<User>;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    settingsRepository = moduleFixture.get<Repository<InstanceConfig>>(
      getRepositoryToken(InstanceConfig),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();

    // Register and login as admin to get token for setup
    const loginResponse = await registerAndLogin(app, 'admin-public');
    accessToken = loginResponse.accessToken;

    const user = await userRepository.findOne({
      where: { email: loginResponse.email },
    });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }
    user.role = 'admin';
    await userRepository.save(user);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Backup original settings
    const originalSettings = await settingsRepository.findOne({
      where: {},
    });
    expect(originalSettings).toBeDefined();
    if (!originalSettings) {
      throw new Error('InstanceConfig not found');
    }
    const originalBranding = originalSettings?.branding || {};

    // Reset branding to clean state before each test
    await settingsRepository.update(
      { id: originalSettings.id },
      {
        branding: {
          ...originalBranding,
          socialImage: null,
          socialDescription: null,
          openGraph: null,
          twitter: null,
        },
      },
    );
  });

  afterEach(async () => {
    // Restore original branding after each test
    const originalSettings = await settingsRepository.findOne({
      where: {},
    });
    expect(originalSettings).toBeDefined();
    if (!originalSettings) {
      throw new Error('InstanceConfig not found');
    }
    const originalBranding = originalSettings?.branding || {};

    await settingsRepository.update(
      { id: originalSettings.id },
      {
        branding: {
          ...originalBranding,
          socialImage: null,
          socialDescription: null,
          openGraph: null,
          twitter: null,
        },
      },
    );
  });

  describe('GET /api/public/settings', () => {
    it('should return branding with social metadata fields', async () => {
      // Setup social metadata via admin endpoint
      const socialMetadata = {
        branding: {
          socialImage: { imageUrl: 'https://example.com/shared-social.jpg' },
          socialDescription: 'Shared social description',
          openGraph: {
            title: 'OG Title',
            description: 'OG Description',
            imageUrl: 'https://example.com/og-image.jpg',
          },
          twitter: {
            title: 'Twitter Title',
            description: 'Twitter Description',
            imageUrl: 'https://example.com/twitter-image.jpg',
            card: 'summary_large_image',
          },
        },
      };

      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(socialMetadata)
        .expect(200);

      // Test public endpoint
      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;
      expect(body).toHaveProperty('branding');
      const branding = body.branding;

      // Should include social metadata fields
      expect(branding).toHaveProperty('socialImage');
      expect(branding.socialImage).toEqual({
        imageUrl: 'https://example.com/shared-social.jpg',
      });
      expect(branding).toHaveProperty(
        'socialDescription',
        'Shared social description',
      );
      expect(branding).toHaveProperty('openGraph');
      expect(branding.openGraph).toEqual({
        title: 'OG Title',
        description: 'OG Description',
        imageUrl: 'https://example.com/og-image.jpg',
      });
      expect(branding).toHaveProperty('twitter');
      expect(branding.twitter).toEqual({
        title: 'Twitter Title',
        description: 'Twitter Description',
        imageUrl: 'https://example.com/twitter-image.jpg',
        card: 'summary_large_image',
      });
    });

    it('should return null for missing social metadata fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;
      expect(body).toHaveProperty('branding');
      const branding = body.branding;

      // Should return null for missing fields
      expect(branding).toHaveProperty('socialImage', null);
      expect(branding).toHaveProperty('socialDescription', null);
      expect(branding).toHaveProperty('openGraph', null);
      expect(branding).toHaveProperty('twitter', null);
    });

    it('should return partial social metadata when only some fields are set', async () => {
      // Setup only openGraph data
      const partialMetadata = {
        branding: {
          openGraph: {
            title: 'Only OG Title',
            description: 'Only OG Description',
          },
        },
      };

      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(partialMetadata)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;
      expect(body).toHaveProperty('branding');
      const branding = body.branding;

      // Should return only what's set
      expect(branding).not.toHaveProperty('socialImage');
      expect(branding).not.toHaveProperty('socialDescription');
      expect(branding.openGraph).toEqual({
        title: 'Only OG Title',
        description: 'Only OG Description',
      });
      expect(branding).not.toHaveProperty('twitter');
    });

    it('should return twitter app card with all fields', async () => {
      const appCardMetadata = {
        branding: {
          twitter: {
            card: 'app',
            title: 'App Title',
            description: 'App Description',
            imageUrl: 'https://example.com/app-image.jpg',
            app: {
              name: 'Bee App',
              id: {
                iphone: '123',
              },
              url: {
                iphone: 'https://apps.apple.com/app/id123',
              },
            },
          },
        },
      };

      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(appCardMetadata)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;
      expect(body.branding.twitter).toEqual(appCardMetadata.branding.twitter);
    });

    it('should return twitter player card with all fields', async () => {
      const playerCardMetadata = {
        branding: {
          twitter: {
            card: 'player',
            title: 'Player Title',
            description: 'Player Description',
            imageUrl: 'https://example.com/player-image.jpg',
            player: {
              url: 'https://example.com/player.html',
              width: 640,
              height: 360,
              stream: 'https://example.com/video.mp4',
              streamContentType: 'video/mp4',
            },
          },
        },
      };

      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(playerCardMetadata)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;
      expect(body.branding.twitter).toEqual(
        playerCardMetadata.branding.twitter,
      );
    });

    it('should not expose sensitive social credentials in public endpoint', async () => {
      // Setup with social credentials (should not be exposed)
      const metadataWithCredentials = {
        branding: {
          socialImage: { imageUrl: 'https://example.com/social.jpg' },
          openGraph: {
            title: 'OG Title',
          },
          twitter: {
            card: 'summary',
            title: 'Twitter Title',
          },
        },
        socialCredentials: {
          facebook: {
            clientId: 'secret-facebook-id',
            clientSecret: 'secret-facebook-secret',
          },
        },
      };

      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(metadataWithCredentials)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;

      // Should not include socialCredentials
      expect(body).not.toHaveProperty('socialCredentials');

      // Should include branding social metadata
      expect(body.branding).toHaveProperty('socialImage');
      expect(body.branding.socialImage).toEqual({
        imageUrl: 'https://example.com/social.jpg',
      });
      expect(body.branding.openGraph).toHaveProperty('title', 'OG Title');
      expect(body.branding.twitter).toHaveProperty('card', 'summary');
      expect(body.branding.twitter).toHaveProperty('title', 'Twitter Title');
    });

    it('should return other public fields along with social metadata', async () => {
      // Setup social metadata
      await request(app.getHttpServer())
        .patch('/api/admin/settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          branding: {
            socialImage: { imageUrl: 'https://example.com/social.jpg' },
            openGraph: {
              title: 'OG Title',
            },
          },
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/public/settings')
        .expect(200);

      const body = response.body as unknown as PublicSettingsBody;

      // Should include expected public fields
      expect(body).toHaveProperty('branding');
      expect(body).toHaveProperty('features');
      expect(body).toHaveProperty('languages');

      // Should not include sensitive fields
      expect(body).not.toHaveProperty('socialCredentials');
      expect(body).not.toHaveProperty('stripe');
    });
  });
});
