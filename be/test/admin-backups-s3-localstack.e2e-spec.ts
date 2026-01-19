import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import {
  CreateBucketCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppModule } from '../src/app.module';
import { User } from '../src/auth/user.entity';
import { registerAndLogin } from './utils/auth-helpers';

const run = process.env.RUN_LOCALSTACK_E2E === 'true';
const maybeDescribe = run ? describe : describe.skip;

maybeDescribe('Admin Backups – LocalStack S3 sync (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

  const region = process.env.AWS_REGION ?? 'eu-west-1';
  const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:4566';

  const bucket = `beelms-e2e-${Date.now()}`.toLowerCase();
  const prefix = 'backups';

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    },
  });

  beforeAll(async () => {
    process.env.S3_ENDPOINT = endpoint;
    process.env.S3_FORCE_PATH_STYLE = 'true';

    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch {
      void 0;
    }

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

  const makeAdmin = async (emailLabel: string) => {
    const { email, accessToken } = await registerAndLogin(app, emailLabel);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw new Error('User not found');
    user.role = 'admin';
    await userRepo.save(user);
    return { token: accessToken };
  };

  it('uploads backup and syncs to LocalStack S3', async () => {
    const { token } = await makeAdmin('admin-backups-localstack');

    await request(app.getHttpServer())
      .patch('/api/admin/backups/remote-config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        s3: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
          bucket,
          region,
          prefix,
        },
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/admin/backups/remote-config/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect({ ok: true });

    const uploadRes = await request(app.getHttpServer())
      .post('/api/admin/backups/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('SELECT 1;\n', 'utf8'), {
        filename: 'sample.sql',
        contentType: 'application/sql',
      })
      .expect(201);

    const body = uploadRes.body as {
      backup?: { filename?: string };
    };

    const filename = (body.backup?.filename ?? '').trim();
    expect(filename.length > 0).toBe(true);

    const key = `${prefix}/${filename}`;

    for (let i = 0; i < 10; i += 1) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    throw new Error('S3 object not found after sync');
  });
});
