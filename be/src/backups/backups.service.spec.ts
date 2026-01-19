import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Backup } from './backup.entity';
import { BackupLog } from './backup-log.entity';
import { BackupsService } from './backups.service';
import { InstanceConfig } from '../settings/instance-config.entity';
import { SettingsService } from '../settings/settings.service';

let sendMock: jest.Mock;

class PutObjectCommandMock {
  constructor(public readonly input: unknown) {}
}

class HeadBucketCommandMock {
  constructor(public readonly input: unknown) {}
}

class S3ClientMock {
  constructor(config: unknown) {
    void config;
  }

  send(command: unknown): Promise<unknown> {
    return sendMock(command);
  }
}

jest.mock('@aws-sdk/client-s3', () => {
  return {
    PutObjectCommand: PutObjectCommandMock,
    HeadBucketCommand: HeadBucketCommandMock,
    S3Client: S3ClientMock,
  };
});

describe('BackupsService – S3 sync', () => {
  let service: BackupsService;
  let backupsRepo: {
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
  };
  let logsRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let settingsService: { getOrCreateInstanceConfig: jest.Mock };

  let tmpDir: string;
  let tmpFile: string;

  beforeEach(async () => {
    sendMock = jest.fn();

    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'beelms-s3-'));
    tmpFile = path.join(tmpDir, 'backup.sql');
    await fs.promises.writeFile(tmpFile, 'SELECT 1;\n', 'utf8');

    backupsRepo = {
      save: jest.fn(async (b) => b),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((e) => e),
    };

    logsRepo = {
      create: jest.fn((e) => e),
      save: jest.fn(async (e) => e),
    };

    settingsService = {
      getOrCreateInstanceConfig: jest.fn().mockResolvedValue({
        backupConfig: {
          remote: {
            enabled: true,
            provider: 's3',
            s3: {
              accessKeyId: 'akid',
              secretAccessKey: 'secret',
              bucket: 'bucket',
              region: 'eu-west-1',
              prefix: 'backups',
            },
          },
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        {
          provide: getRepositoryToken(Backup),
          useValue: backupsRepo,
        },
        {
          provide: getRepositoryToken(BackupLog),
          useValue: logsRepo,
        },
        {
          provide: getRepositoryToken(InstanceConfig),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('marks backup as both and logs backup_synced on success', async () => {
    sendMock.mockResolvedValue({});

    const backup: Backup = {
      id: 'b1',
      filename: 'f.sql',
      path: tmpFile,
      type: 'manual',
      storage: 'local',
      sizeBytes: '1',
      sha256: 'x',
      status: 'ready',
      encryptionMeta: null,
      errorMessage: null,
      createdByUserId: null,
      createdByEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const trySync = (service as unknown as Record<string, unknown>)[
      'trySyncBackupToRemote'
    ] as (
      b: Backup,
      a: { actorUserId: string; actorEmail: string | null },
    ) => Promise<void>;

    await trySync(backup, { actorUserId: 'u1', actorEmail: 'a@b.c' });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(backup.storage).toBe('both');
    expect(backupsRepo.save).toHaveBeenCalled();

    const savedActions = logsRepo.save.mock.calls.map((c) => c[0]?.action);
    expect(savedActions).toContain('backup_synced');
  });

  it('retries 3 times and logs backup_sync_failed on failure', async () => {
    jest.useFakeTimers();
    sendMock.mockRejectedValue(new Error('s3 down'));

    const backup: Backup = {
      id: 'b1',
      filename: 'f.sql',
      path: tmpFile,
      type: 'manual',
      storage: 'local',
      sizeBytes: '1',
      sha256: 'x',
      status: 'ready',
      encryptionMeta: null,
      errorMessage: null,
      createdByUserId: null,
      createdByEmail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const trySync = (service as unknown as Record<string, unknown>)[
      'trySyncBackupToRemote'
    ] as (
      b: Backup,
      a: { actorUserId: string; actorEmail: string | null },
    ) => Promise<void>;

    const p = trySync(backup, { actorUserId: 'u1', actorEmail: 'a@b.c' });

    await jest.advanceTimersByTimeAsync(2000);
    await p;

    expect(sendMock).toHaveBeenCalledTimes(3);

    const savedActions = logsRepo.save.mock.calls.map((c) => c[0]?.action);
    expect(savedActions).toContain('backup_sync_failed');

    jest.useRealTimers();
  });

  it('testRemoteBackupConfig calls HeadBucketCommand and returns ok', async () => {
    sendMock.mockResolvedValue({});

    await expect(service.testRemoteBackupConfig()).resolves.toEqual({
      ok: true,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('testRemoteBackupConfig throws if missing S3 config', async () => {
    settingsService.getOrCreateInstanceConfig.mockResolvedValue({
      backupConfig: { remote: { enabled: true, provider: 's3', s3: null } },
    });

    await expect(service.testRemoteBackupConfig()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
