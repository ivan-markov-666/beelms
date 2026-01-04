import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';
import * as fs from 'fs';
import * as path from 'path';

describe('Admin Settings – social-image upload (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let unlinkSpy: jest.SpiedFunction<typeof fs.promises.unlink>;

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

    unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
  });

  afterAll(async () => {
    unlinkSpy.mockRestore();
    await app.close();
  });

  beforeEach(() => {
    unlinkSpy.mockClear();
  });

  it('accepts PNG/JPG/WEBP uploads and returns URL with purpose prefix', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-social-image-upload-valid',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const pngBuffer = Buffer.from('fake-png-content');
    const jpgBuffer = Buffer.from('fake-jpg-content');
    const webpBuffer = Buffer.from('fake-webp-content');

    const pngRes = await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pngBuffer, 'test.png')
      .field('purpose', 'twitter')
      .expect(201);

    const jpgRes = await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', jpgBuffer, 'test.jpg')
      .field('purpose', 'shared')
      .expect(201);

    const webpRes = await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', webpBuffer, 'test.webp')
      .field('purpose', 'open-graph')
      .expect(201);

    const pngBody = pngRes.body as { url: string };
    const jpgBody = jpgRes.body as { url: string };
    const webpBody = webpRes.body as { url: string };

    expect(pngBody.url).toMatch(/^\/branding\/media\/twitter-\d+\.png$/);
    expect(jpgBody.url).toMatch(/^\/branding\/media\/shared-\d+\.jpg$/);
    expect(webpBody.url).toMatch(/^\/branding\/media\/open-graph-\d+\.webp$/);
  });

  it('rejects unsupported MIME types (e.g. GIF)', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-social-image-upload-invalid-mime',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const gifBuffer = Buffer.from('fake-gif-content');

    await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', gifBuffer, 'test.gif')
      .field('purpose', 'twitter')
      .expect(400);
  });

  it('normalizes purpose and defaults to open-graph for unknown values', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-social-image-upload-purpose-normalize',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const pngBuffer = Buffer.from('fake-png-content');

    const res1 = await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pngBuffer, 'test.png')
      .field('purpose', 'twItTeR')
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pngBuffer, 'test.png')
      .field('purpose', 'unknown')
      .expect(201);

    const body1 = res1.body as { url: string };
    const body2 = res2.body as { url: string };

    expect(body1.url).toMatch(/^\/branding\/media\/twitter-\d+\.png$/);
    expect(body2.url).toMatch(/^\/branding\/media\/open-graph-\d+\.png$/);
  });

  it('attempts to delete previousUrl when it starts with /branding/media/', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-social-image-upload-delete-previous',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const pngBuffer = Buffer.from('fake-png-content');

    await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pngBuffer, 'test.png')
      .field('purpose', 'twitter')
      .field('previousUrl', '/branding/media/twitter-123.png')
      .expect(201);

    expect(unlinkSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `${path.sep}media${path.sep}branding${path.sep}twitter-123.png`,
      ),
    );
  });

  it('does not attempt to delete previousUrl when it does not start with /branding/media/', async () => {
    const { email, accessToken } = await registerAndLogin(
      app,
      'admin-settings-social-image-upload-no-delete-external',
    );

    const user = await userRepo.findOne({ where: { email } });
    expect(user).toBeDefined();
    if (!user) {
      throw new Error('User not found after registerAndLogin');
    }

    user.role = 'admin';
    await userRepo.save(user);

    const pngBuffer = Buffer.from('fake-png-content');

    await request(app.getHttpServer())
      .post('/api/admin/settings/branding/social-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pngBuffer, 'test.png')
      .field('purpose', 'twitter')
      .field('previousUrl', 'https://cdn.example.com/image.png')
      .expect(201);

    expect(unlinkSpy).not.toHaveBeenCalled();
  });
});
